package auth

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"

	"go-backend/internal/db"

	"github.com/jackc/pgx/v5"
)

type memoryStore struct {
	google   map[string]db.AuthUser
	sessions map[string]db.AuthUser
}

func newMemoryStore() *memoryStore {
	return &memoryStore{
		google:   make(map[string]db.AuthUser),
		sessions: make(map[string]db.AuthUser),
	}
}

func (s *memoryStore) GetOrCreateGoogleAccount(_ context.Context, userID, _ string, subject, email, displayName string) (db.AuthUser, error) {
	if user, exists := s.google[subject]; exists {
		return user, nil
	}
	user := db.AuthUser{ID: userID, DisplayName: displayName, Email: email}
	s.google[subject] = user
	return user, nil
}

func (s *memoryStore) CreateSession(_ context.Context, hash []byte, userID string, _ time.Time) error {
	for _, user := range s.google {
		if user.ID == userID {
			s.sessions[string(hash)] = user
			return nil
		}
	}
	return errors.New("account not found")
}

func (s *memoryStore) GetSession(_ context.Context, hash []byte) (db.AuthUser, error) {
	user, exists := s.sessions[string(hash)]
	if !exists {
		return db.AuthUser{}, pgx.ErrNoRows
	}
	return user, nil
}

func (s *memoryStore) DeleteSession(_ context.Context, hash []byte) error {
	delete(s.sessions, string(hash))
	return nil
}

func TestGoogleSignInStartsWithCSRFState(t *testing.T) {
	t.Setenv("GOOGLE_CLIENT_ID", "client-id")
	t.Setenv("GOOGLE_CLIENT_SECRET", "client-secret")
	t.Setenv("GOOGLE_REDIRECT_URL", "http://localhost:8080/api/auth/google/callback")
	t.Setenv("FRONTEND_ORIGIN", "http://localhost:3000")
	handler := NewHandler(newMemoryStore())
	request := httptest.NewRequest(http.MethodGet, "/api/auth/google?returnTo=%2Froom%2Froom-1", nil)
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, request)

	if response.Code != http.StatusFound {
		t.Fatalf("expected redirect status %d, got %d: %s", http.StatusFound, response.Code, response.Body.String())
	}
	location, err := url.Parse(response.Header().Get("Location"))
	if err != nil {
		t.Fatalf("parse redirect: %v", err)
	}
	if location.Host != "accounts.google.com" || location.Query().Get("client_id") != "client-id" {
		t.Fatalf("unexpected Google authorization redirect: %s", location)
	}
	if location.Query().Get("state") == "" || location.Query().Get("redirect_uri") != "http://localhost:8080/api/auth/google/callback" {
		t.Fatalf("authorization redirect is missing OAuth parameters: %s", location)
	}
	cookies := response.Result().Cookies()
	if len(cookies) != 2 || cookies[0].Name != googleStateCookie || cookies[1].Name != googleReturnCookie {
		t.Fatalf("expected state and return-path cookies, got %+v", cookies)
	}
	for _, cookie := range cookies {
		if !cookie.HttpOnly || cookie.Path != "/api/auth/google" || cookie.MaxAge <= 0 {
			t.Fatalf("unexpected OAuth cookie: %+v", cookie)
		}
	}
	if cookies[1].Value != "/room/room-1" {
		t.Fatalf("unexpected saved return path %q", cookies[1].Value)
	}
}

func TestGoogleCallbackCreatesAccountAndSession(t *testing.T) {
	t.Setenv("GOOGLE_CLIENT_ID", "client-id")
	t.Setenv("GOOGLE_CLIENT_SECRET", "client-secret")
	t.Setenv("GOOGLE_REDIRECT_URL", "http://localhost:8080/api/auth/google/callback")
	t.Setenv("FRONTEND_ORIGIN", "http://localhost:3000")

	googleServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/token" {
			if err := r.ParseForm(); err != nil || r.Form.Get("code") != "auth-code" {
				http.Error(w, "invalid authorization code", http.StatusBadRequest)
				return
			}
			_, _ = w.Write([]byte(`{"id_token":"google-id-token"}`))
			return
		}
		if r.URL.Path == "/tokeninfo" {
			if r.URL.Query().Get("id_token") != "google-id-token" {
				http.Error(w, "invalid token", http.StatusUnauthorized)
				return
			}
			_, _ = w.Write([]byte(`{
				"iss":"https://accounts.google.com",
				"aud":"client-id",
				"sub":"google-user-1",
				"email":"alex@example.com",
				"email_verified":"true",
				"name":"Alex",
				"exp":"4102444800"
			}`))
			return
		}
		http.NotFound(w, r)
	}))
	defer googleServer.Close()

	store := newMemoryStore()
	handler := NewHandler(store)
	handler.httpClient = googleServer.Client()
	handler.googleTokenURL = googleServer.URL + "/token"
	handler.googleTokenInfoURL = googleServer.URL + "/tokeninfo"

	request := httptest.NewRequest(http.MethodGet, "/api/auth/google/callback?code=auth-code&state=state-1", nil)
	request.Header.Set("Origin", "https://accounts.google.com")
	request.AddCookie(&http.Cookie{Name: googleStateCookie, Value: "state-1"})
	request.AddCookie(&http.Cookie{Name: googleReturnCookie, Value: "/room/room-1"})
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, request)

	if response.Code != http.StatusFound || response.Header().Get("Location") != "http://localhost:3000/room/room-1" {
		t.Fatalf("expected redirect to original room, got status %d and location %q", response.Code, response.Header().Get("Location"))
	}
	user, exists := store.google["google-user-1"]
	if !exists || user.Email != "alex@example.com" || user.DisplayName != "Alex" {
		t.Fatalf("expected Google account to be created, got %+v", user)
	}
	if len(store.sessions) != 1 {
		t.Fatalf("expected a session to be created, got %d", len(store.sessions))
	}
	cookies := response.Result().Cookies()
	var sessionCookie *http.Cookie
	for _, cookie := range cookies {
		if cookie.Name == sessionCookieName && cookie.Path == "/" {
			sessionCookie = cookie
		}
	}
	if sessionCookie == nil || !sessionCookie.HttpOnly || sessionCookie.Path != "/" || !sessionCookie.Secure {
		t.Fatalf("expected secure HTTP-only session cookie scoped to the app, got %+v", sessionCookie)
	}
}

func TestGoogleCallbackRejectsInvalidState(t *testing.T) {
	t.Setenv("FRONTEND_ORIGIN", "http://localhost:3000")
	store := newMemoryStore()
	handler := NewHandler(store)
	request := httptest.NewRequest(http.MethodGet, "/api/auth/google/callback?code=auth-code&state=wrong", nil)
	request.AddCookie(&http.Cookie{Name: googleStateCookie, Value: "expected"})
	request.AddCookie(&http.Cookie{Name: googleReturnCookie, Value: "/room/room-1"})
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, request)

	if response.Code != http.StatusFound || response.Header().Get("Location") != "http://localhost:3000/account?error=google_signin_failed" {
		t.Fatalf("expected failed sign-in redirect, got status %d and location %q", response.Code, response.Header().Get("Location"))
	}
	if len(store.google) != 0 || len(store.sessions) != 0 {
		t.Fatal("invalid OAuth state must not create an account or session")
	}
}

func TestLegacyPasswordRegistrationIsNotAvailable(t *testing.T) {
	handler := NewHandler(newMemoryStore())
	request := httptest.NewRequest(http.MethodPost, "/api/auth/register", strings.NewReader(
		`{"displayName":"Alex","email":"alex@example.com","password":"a-long-password"}`,
	))
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, request)

	if response.Code != http.StatusNotFound {
		t.Fatalf("expected legacy registration to be disabled, got status %d", response.Code)
	}
}

func TestRejectsUnconfiguredOrigin(t *testing.T) {
	t.Setenv("FRONTEND_ORIGIN", "http://localhost:3000")
	handler := NewHandler(newMemoryStore())
	request := httptest.NewRequest(http.MethodOptions, "/api/auth/me", nil)
	request.Header.Set("Origin", "https://untrusted.example")
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, request)

	if response.Code != http.StatusForbidden {
		t.Fatalf("expected status %d, got %d", http.StatusForbidden, response.Code)
	}
}

func TestSafeReturnPathRejectsExternalURLs(t *testing.T) {
	for _, path := range []string{"https://example.com", "//example.com/path", "/\\example.com", "/%2f%2fevil.example", ""} {
		if got := safeReturnPath(path); got != "/account" {
			t.Errorf("safeReturnPath(%q) = %q, want /account", path, got)
		}
	}
	if got := safeReturnPath("/room/room-1?tab=items"); got != "/room/room-1?tab=items" {
		t.Fatalf("expected local room path to be retained, got %q", got)
	}
}

func TestGoogleVerifiedClaimAcceptsBooleanAndString(t *testing.T) {
	for _, value := range []string{`true`, `"true"`} {
		var claims struct {
			Verified googleVerified `json:"verified"`
		}
		if err := json.Unmarshal([]byte(`{"verified":`+value+`}`), &claims); err != nil {
			t.Fatalf("decode %s: %v", value, err)
		}
		if !bool(claims.Verified) {
			t.Errorf("expected %s to be treated as verified", value)
		}
	}
}
