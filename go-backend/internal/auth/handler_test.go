package auth

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"go-backend/internal/db"

	"github.com/jackc/pgx/v5"
	"golang.org/x/crypto/bcrypt"
)

type memoryStore struct {
	accounts map[string]db.AuthUser
	sessions map[string]db.AuthUser
}

func newMemoryStore() *memoryStore {
	return &memoryStore{
		accounts: make(map[string]db.AuthUser),
		sessions: make(map[string]db.AuthUser),
	}
}

func (s *memoryStore) CreatePasswordAccount(_ context.Context, userID, _ string, displayName, email, passwordHash string) error {
	if _, exists := s.accounts[email]; exists {
		return db.ErrEmailTaken
	}
	s.accounts[email] = db.AuthUser{
		ID: userID, DisplayName: displayName, Email: email, PasswordHash: passwordHash,
	}
	return nil
}

func (s *memoryStore) GetPasswordAccount(_ context.Context, email string) (db.AuthUser, error) {
	user, exists := s.accounts[email]
	if !exists {
		return db.AuthUser{}, pgx.ErrNoRows
	}
	return user, nil
}

func (s *memoryStore) CreateSession(_ context.Context, hash []byte, userID string, _ time.Time) error {
	for _, user := range s.accounts {
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

func TestRegisterCreatesHashedPasswordAndSession(t *testing.T) {
	store := newMemoryStore()
	handler := NewHandler(store)
	request := httptest.NewRequest(http.MethodPost, "/api/auth/register", strings.NewReader(
		`{"displayName":"Alex","email":"Alex@example.com","password":"a-long-password"}`,
	))
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Origin", "http://localhost:3000")
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, request)

	if response.Code != http.StatusCreated {
		t.Fatalf("expected status %d, got %d: %s", http.StatusCreated, response.Code, response.Body.String())
	}
	user, exists := store.accounts["alex@example.com"]
	if !exists {
		t.Fatal("expected account email to be normalized")
	}
	if user.PasswordHash == "a-long-password" {
		t.Fatal("password must not be stored in plain text")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte("a-long-password")); err != nil {
		t.Fatalf("stored password hash does not match: %v", err)
	}
	cookie := response.Result().Cookies()[0]
	if cookie.Name != sessionCookieName || !cookie.HttpOnly {
		t.Fatalf("expected an HttpOnly account session cookie, got %+v", cookie)
	}

	var result accountResponse
	if err := json.Unmarshal(response.Body.Bytes(), &result); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if result.Email != "alex@example.com" || result.DisplayName != "Alex" {
		t.Fatalf("unexpected account response: %+v", result)
	}

	checkRequest := httptest.NewRequest(http.MethodGet, "/api/auth/me", nil)
	checkRequest.AddCookie(cookie)
	checkResponse := httptest.NewRecorder()
	handler.ServeHTTP(checkResponse, checkRequest)
	if checkResponse.Code != http.StatusOK {
		t.Fatalf("expected signed-in session status %d, got %d", http.StatusOK, checkResponse.Code)
	}

	logoutRequest := httptest.NewRequest(http.MethodPost, "/api/auth/logout", nil)
	logoutRequest.AddCookie(cookie)
	logoutResponse := httptest.NewRecorder()
	handler.ServeHTTP(logoutResponse, logoutRequest)
	if logoutResponse.Code != http.StatusNoContent {
		t.Fatalf("expected logout status %d, got %d", http.StatusNoContent, logoutResponse.Code)
	}
	if len(store.sessions) != 0 {
		t.Fatal("expected logout to revoke the session")
	}
}

func TestRegisterRejectsShortPassword(t *testing.T) {
	handler := NewHandler(newMemoryStore())
	request := httptest.NewRequest(http.MethodPost, "/api/auth/register", strings.NewReader(
		`{"displayName":"Alex","email":"alex@example.com","password":"short"}`,
	))
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, request)

	if response.Code != http.StatusBadRequest {
		t.Fatalf("expected status %d, got %d", http.StatusBadRequest, response.Code)
	}
}

func TestRejectsUnconfiguredOrigin(t *testing.T) {
	t.Setenv("FRONTEND_ORIGIN", "http://localhost:3000")
	handler := NewHandler(newMemoryStore())
	request := httptest.NewRequest(http.MethodOptions, "/api/auth/register", nil)
	request.Header.Set("Origin", "https://untrusted.example")
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, request)

	if response.Code != http.StatusForbidden {
		t.Fatalf("expected status %d, got %d", http.StatusForbidden, response.Code)
	}
}
