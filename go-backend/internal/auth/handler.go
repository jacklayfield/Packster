package auth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/mail"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	"go-backend/internal/db"

	"github.com/jackc/pgx/v5"
)

const (
	SessionCookieName  = "packster_session"
	sessionCookieName  = SessionCookieName
	googleStateCookie  = "packster_google_state"
	googleReturnCookie = "packster_google_return"
	sessionDuration    = 30 * 24 * time.Hour
	oauthStateDuration = 10 * time.Minute
)

type accountStore interface {
	GetOrCreateGoogleAccount(context.Context, string, string, string, string, string) (db.AuthUser, error)
	CreateSession(context.Context, []byte, string, time.Time) error
	GetSession(context.Context, []byte) (db.AuthUser, error)
	DeleteSession(context.Context, []byte) error
}

type roomStore interface {
	ListOwnedRooms(context.Context, string) ([]db.OwnedRoom, error)
	DeleteOwnedRoom(context.Context, string, string) (bool, error)
}

type Handler struct {
	store              accountStore
	deleteRoom         func(context.Context, string, string) (bool, error)
	httpClient         *http.Client
	googleTokenURL     string
	googleTokenInfoURL string
}

func (h *Handler) SetRoomDeleteHandler(handler func(context.Context, string, string) (bool, error)) {
	h.deleteRoom = handler
}

func NewHandler(store accountStore) *Handler {
	return &Handler{
		store:              store,
		httpClient:         &http.Client{Timeout: 10 * time.Second},
		googleTokenURL:     "https://oauth2.googleapis.com/token",
		googleTokenInfoURL: "https://oauth2.googleapis.com/tokeninfo",
	}
}

type accountResponse struct {
	ID          string `json:"id"`
	DisplayName string `json:"displayName"`
	Email       string `json:"email"`
}

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/auth/")
	if path != "google/callback" && !h.setCORS(w, r) {
		http.Error(w, "origin not allowed", http.StatusForbidden)
		return
	}
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	switch path {
	case "google":
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		h.startGoogleSignIn(w, r)
	case "google/callback":
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		h.finishGoogleSignIn(w, r)
	case "me":
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		h.me(w, r)
	case "logout":
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		h.logout(w, r)
	case "rooms":
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		h.listRooms(w, r)
	default:
		if strings.HasPrefix(path, "rooms/") {
			if r.Method != http.MethodDelete {
				http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
				return
			}
			h.deleteOwnedRoom(w, r, strings.TrimPrefix(path, "rooms/"))
			return
		}
		http.NotFound(w, r)
	}
}

func (h *Handler) listRooms(w http.ResponseWriter, r *http.Request) {
	user, ok, serverError := h.sessionUser(w, r)
	if !ok {
		if !serverError {
			writeError(w, http.StatusUnauthorized, "Not signed in.")
		}
		return
	}
	store, ok := h.store.(roomStore)
	if !ok {
		writeError(w, http.StatusInternalServerError, "Unable to load your rooms.")
		return
	}
	rooms, err := store.ListOwnedRooms(r.Context(), user.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Unable to load your rooms.")
		return
	}
	writeJSON(w, http.StatusOK, rooms)
}

func (h *Handler) deleteOwnedRoom(w http.ResponseWriter, r *http.Request, roomID string) {
	if roomID == "" || strings.Contains(roomID, "/") {
		writeError(w, http.StatusBadRequest, "A room ID is required.")
		return
	}
	user, ok, serverError := h.sessionUser(w, r)
	if !ok {
		if !serverError {
			writeError(w, http.StatusUnauthorized, "Not signed in.")
		}
		return
	}
	deleter := h.deleteRoom
	if deleter == nil {
		store, ok := h.store.(roomStore)
		if !ok {
			writeError(w, http.StatusInternalServerError, "Unable to delete the room.")
			return
		}
		deleter = store.DeleteOwnedRoom
	}
	deleted, err := deleter(r.Context(), roomID, user.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Unable to delete the room.")
		return
	}
	if !deleted {
		writeError(w, http.StatusNotFound, "Room not found.")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) me(w http.ResponseWriter, r *http.Request) {
	user, ok, serverError := h.sessionUser(w, r)
	if !ok {
		if !serverError {
			writeError(w, http.StatusUnauthorized, "Not signed in.")
		}
		return
	}
	writeJSON(w, http.StatusOK, accountResponse{ID: user.ID, DisplayName: user.DisplayName, Email: user.Email})
}

func (h *Handler) logout(w http.ResponseWriter, r *http.Request) {
	if cookie, err := r.Cookie(sessionCookieName); err == nil {
		if err := h.store.DeleteSession(r.Context(), tokenHash(cookie.Value)); err != nil {
			writeError(w, http.StatusInternalServerError, "Unable to sign out.")
			return
		}
	}
	clearSessionCookie(w, r)
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) startSession(w http.ResponseWriter, r *http.Request, user db.AuthUser) bool {
	token, err := randomToken()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Unable to start a session.")
		return false
	}
	expiresAt := time.Now().Add(sessionDuration)
	if err := h.store.CreateSession(r.Context(), tokenHash(token), user.ID, expiresAt); err != nil {
		writeError(w, http.StatusInternalServerError, "Unable to start a session.")
		return false
	}
	setSessionCookie(w, r, token, expiresAt)
	clearCookie(w, r, sessionCookieName, "/api/auth")
	return true
}

func (h *Handler) sessionUser(w http.ResponseWriter, r *http.Request) (db.AuthUser, bool, bool) {
	user, ok, err := h.AuthenticateRequest(r)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Unable to check session.")
		return db.AuthUser{}, false, true
	}
	if !ok {
		return db.AuthUser{}, false, false
	}
	return user, true, false
}

func (h *Handler) AuthenticateRequest(r *http.Request) (db.AuthUser, bool, error) {
	cookie, err := r.Cookie(sessionCookieName)
	if err != nil {
		return db.AuthUser{}, false, nil
	}
	return h.AuthenticateToken(r.Context(), cookie.Value)
}

func (h *Handler) AuthenticateToken(ctx context.Context, token string) (db.AuthUser, bool, error) {
	user, err := h.store.GetSession(ctx, tokenHash(token))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return db.AuthUser{}, false, nil
		}
		return db.AuthUser{}, false, err
	}
	return user, true, nil
}

type googleTokenResponse struct {
	IDToken string `json:"id_token"`
}

type googleIdentity struct {
	Issuer        string         `json:"iss"`
	Audience      string         `json:"aud"`
	Subject       string         `json:"sub"`
	Email         string         `json:"email"`
	EmailVerified googleVerified `json:"email_verified"`
	Name          string         `json:"name"`
	ExpiresAt     string         `json:"exp"`
}

type googleVerified bool

func (verified *googleVerified) UnmarshalJSON(data []byte) error {
	var boolean bool
	if err := json.Unmarshal(data, &boolean); err == nil {
		*verified = googleVerified(boolean)
		return nil
	}
	var value string
	if err := json.Unmarshal(data, &value); err != nil {
		return err
	}
	*verified = googleVerified(value == "true")
	return nil
}

func (h *Handler) startGoogleSignIn(w http.ResponseWriter, r *http.Request) {
	clientID := strings.TrimSpace(os.Getenv("GOOGLE_CLIENT_ID"))
	clientSecret := strings.TrimSpace(os.Getenv("GOOGLE_CLIENT_SECRET"))
	redirectURL := strings.TrimSpace(os.Getenv("GOOGLE_REDIRECT_URL"))
	if clientID == "" || clientSecret == "" || redirectURL == "" {
		http.Redirect(w, r, frontendURL("/account?error=google_signin_unavailable"), http.StatusFound)
		return
	}
	parsedRedirect, err := url.Parse(redirectURL)
	if err != nil || parsedRedirect.Host == "" || (parsedRedirect.Scheme != "https" && parsedRedirect.Scheme != "http") {
		http.Redirect(w, r, frontendURL("/account?error=google_signin_unavailable"), http.StatusFound)
		return
	}

	state, err := randomToken()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Unable to start Google sign-in.")
		return
	}
	setShortLivedCookie(w, r, googleStateCookie, state)
	setShortLivedCookie(w, r, googleReturnCookie, safeReturnPath(r.URL.Query().Get("returnTo")))

	authorizationURL, err := url.Parse("https://accounts.google.com/o/oauth2/v2/auth")
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Unable to start Google sign-in.")
		return
	}
	query := authorizationURL.Query()
	query.Set("client_id", clientID)
	query.Set("redirect_uri", redirectURL)
	query.Set("response_type", "code")
	query.Set("scope", "openid email profile")
	query.Set("state", state)
	authorizationURL.RawQuery = query.Encode()
	http.Redirect(w, r, authorizationURL.String(), http.StatusFound)
}

func (h *Handler) finishGoogleSignIn(w http.ResponseWriter, r *http.Request) {
	stateCookie, stateErr := r.Cookie(googleStateCookie)
	returnCookie, returnErr := r.Cookie(googleReturnCookie)
	clearCookie(w, r, googleStateCookie, "/api/auth/google")
	clearCookie(w, r, googleReturnCookie, "/api/auth/google")
	if stateErr != nil || returnErr != nil ||
		subtle.ConstantTimeCompare([]byte(stateCookie.Value), []byte(r.URL.Query().Get("state"))) != 1 {
		http.Redirect(w, r, frontendURL("/account?error=google_signin_failed"), http.StatusFound)
		return
	}

	if r.URL.Query().Get("error") != "" || r.URL.Query().Get("code") == "" {
		http.Redirect(w, r, frontendURL("/account?error=google_signin_failed"), http.StatusFound)
		return
	}

	clientID := strings.TrimSpace(os.Getenv("GOOGLE_CLIENT_ID"))
	clientSecret := strings.TrimSpace(os.Getenv("GOOGLE_CLIENT_SECRET"))
	redirectURL := strings.TrimSpace(os.Getenv("GOOGLE_REDIRECT_URL"))
	if clientID == "" || clientSecret == "" || redirectURL == "" {
		http.Redirect(w, r, frontendURL("/account?error=google_signin_unavailable"), http.StatusFound)
		return
	}
	token, err := h.exchangeGoogleCode(r, r.URL.Query().Get("code"), clientID, clientSecret, redirectURL)
	if err != nil {
		http.Redirect(w, r, frontendURL("/account?error=google_signin_failed"), http.StatusFound)
		return
	}
	identity, err := h.verifyGoogleIDToken(r, token.IDToken, clientID)
	if err != nil {
		http.Redirect(w, r, frontendURL("/account?error=google_signin_failed"), http.StatusFound)
		return
	}
	userID, err := randomID()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Unable to create your account.")
		return
	}
	identityID, err := randomID()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Unable to create your account.")
		return
	}
	user, err := h.store.GetOrCreateGoogleAccount(
		r.Context(), userID, identityID, identity.Subject,
		strings.ToLower(strings.TrimSpace(identity.Email)), strings.TrimSpace(identity.Name),
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Unable to create your account.")
		return
	}
	if !h.startSession(w, r, user) {
		return
	}
	http.Redirect(w, r, frontendURL(safeReturnPath(returnCookie.Value)), http.StatusFound)
}

func (h *Handler) exchangeGoogleCode(r *http.Request, code, clientID, clientSecret, redirectURL string) (googleTokenResponse, error) {
	form := url.Values{
		"code":          {code},
		"client_id":     {clientID},
		"client_secret": {clientSecret},
		"redirect_uri":  {redirectURL},
		"grant_type":    {"authorization_code"},
	}
	request, err := http.NewRequestWithContext(r.Context(), http.MethodPost, h.googleTokenURL, strings.NewReader(form.Encode()))
	if err != nil {
		return googleTokenResponse{}, err
	}
	request.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	response, err := h.httpClient.Do(request)
	if err != nil {
		return googleTokenResponse{}, err
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return googleTokenResponse{}, errors.New("Google token exchange failed")
	}
	var token googleTokenResponse
	if err := json.NewDecoder(io.LimitReader(response.Body, 16*1024)).Decode(&token); err != nil {
		return googleTokenResponse{}, err
	}
	if token.IDToken == "" {
		return googleTokenResponse{}, errors.New("Google did not return an ID token")
	}
	return token, nil
}

func (h *Handler) verifyGoogleIDToken(r *http.Request, idToken, clientID string) (googleIdentity, error) {
	endpoint, err := url.Parse(h.googleTokenInfoURL)
	if err != nil {
		return googleIdentity{}, err
	}
	query := endpoint.Query()
	query.Set("id_token", idToken)
	endpoint.RawQuery = query.Encode()
	request, err := http.NewRequestWithContext(r.Context(), http.MethodGet, endpoint.String(), nil)
	if err != nil {
		return googleIdentity{}, err
	}
	response, err := h.httpClient.Do(request)
	if err != nil {
		return googleIdentity{}, err
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return googleIdentity{}, errors.New("Google ID token verification failed")
	}
	var identity googleIdentity
	if err := json.NewDecoder(io.LimitReader(response.Body, 16*1024)).Decode(&identity); err != nil {
		return googleIdentity{}, err
	}
	expiresAt, err := strconv.ParseInt(identity.ExpiresAt, 10, 64)
	if err != nil || time.Now().Unix() >= expiresAt {
		return googleIdentity{}, errors.New("Google ID token has expired")
	}
	if (identity.Issuer != "https://accounts.google.com" && identity.Issuer != "accounts.google.com") ||
		identity.Audience != clientID || identity.Subject == "" || !bool(identity.EmailVerified) || !validEmail(identity.Email) {
		return googleIdentity{}, errors.New("Google ID token claims are invalid")
	}
	if identity.Name == "" {
		identity.Name = strings.Split(identity.Email, "@")[0]
	}
	if len(identity.Name) > 60 {
		identity.Name = identity.Name[:60]
	}
	return identity, nil
}

func safeReturnPath(path string) string {
	parsed, err := url.Parse(path)
	if err != nil || len(path) > 2048 || parsed.IsAbs() || parsed.Host != "" ||
		!strings.HasPrefix(parsed.Path, "/") || strings.HasPrefix(parsed.Path, "//") ||
		strings.HasPrefix(path, "//") || strings.Contains(path, "\\") {
		return "/account"
	}
	return path
}

func frontendURL(path string) string {
	origin := strings.TrimRight(strings.TrimSpace(os.Getenv("FRONTEND_ORIGIN")), "/")
	if origin == "" {
		origin = "http://localhost:3000"
	}
	return origin + path
}

func setShortLivedCookie(w http.ResponseWriter, r *http.Request, name, value string) {
	http.SetCookie(w, &http.Cookie{
		Name: name, Value: value, Path: "/api/auth/google", HttpOnly: true,
		Secure: requestIsSecure(r), SameSite: http.SameSiteLaxMode,
		MaxAge: int(oauthStateDuration.Seconds()),
	})
}

func requestIsSecure(r *http.Request) bool {
	if r.TLS != nil {
		return true
	}
	origin, err := url.Parse(r.Header.Get("Origin"))
	if err == nil && origin.Scheme == "https" {
		return true
	}
	for _, configuredURL := range []string{os.Getenv("FRONTEND_ORIGIN"), os.Getenv("GOOGLE_REDIRECT_URL")} {
		configured, parseErr := url.Parse(configuredURL)
		if parseErr == nil && configured.Scheme == "https" {
			return true
		}
	}
	return false
}

func clearCookie(w http.ResponseWriter, r *http.Request, name, path string) {
	http.SetCookie(w, &http.Cookie{
		Name: name, Value: "", Path: path, HttpOnly: true,
		Secure: requestIsSecure(r), SameSite: http.SameSiteLaxMode, MaxAge: -1,
	})
}

func (h *Handler) setCORS(w http.ResponseWriter, r *http.Request) bool {
	origin := r.Header.Get("Origin")
	expectedOrigin := os.Getenv("FRONTEND_ORIGIN")
	if expectedOrigin == "" {
		expectedOrigin = "http://localhost:3000"
	}
	if origin != "" && origin != expectedOrigin {
		return false
	}
	if origin != "" {
		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Add("Vary", "Origin")
	}
	return true
}

func validEmail(email string) bool {
	if len(email) > 254 {
		return false
	}
	parsed, err := mail.ParseAddress(email)
	return err == nil && parsed.Address == email && strings.Contains(email, "@")
}

func randomID() (string, error) {
	data := make([]byte, 16)
	if _, err := rand.Read(data); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(data), nil
}

func randomToken() (string, error) {
	data := make([]byte, 32)
	if _, err := rand.Read(data); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(data), nil
}

func tokenHash(token string) []byte {
	hash := sha256.Sum256([]byte(token))
	return hash[:]
}

func setSessionCookie(w http.ResponseWriter, r *http.Request, token string, expiresAt time.Time) {
	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookieName,
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   requestIsSecure(r),
		SameSite: http.SameSiteLaxMode,
		Expires:  expiresAt,
		MaxAge:   int(time.Until(expiresAt).Seconds()),
	})
}

func clearSessionCookie(w http.ResponseWriter, r *http.Request) {
	clearCookie(w, r, sessionCookieName, "/")
	clearCookie(w, r, sessionCookieName, "/api/auth")
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

func writeJSON(w http.ResponseWriter, status int, value interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}
