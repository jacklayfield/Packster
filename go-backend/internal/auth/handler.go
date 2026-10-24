package auth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/mail"
	"net/url"
	"os"
	"strings"
	"time"

	"go-backend/internal/db"

	"github.com/jackc/pgx/v5"
	"golang.org/x/crypto/bcrypt"
)

const (
	sessionCookieName = "packster_session"
	sessionDuration   = 30 * 24 * time.Hour
)

type accountStore interface {
	CreatePasswordAccount(context.Context, string, string, string, string, string) error
	GetPasswordAccount(context.Context, string) (db.AuthUser, error)
	CreateSession(context.Context, []byte, string, time.Time) error
	GetSession(context.Context, []byte) (db.AuthUser, error)
	DeleteSession(context.Context, []byte) error
}

type Handler struct {
	store accountStore
}

func NewHandler(store accountStore) *Handler {
	return &Handler{store: store}
}

type credentials struct {
	DisplayName string `json:"displayName"`
	Email       string `json:"email"`
	Password    string `json:"password"`
}

type accountResponse struct {
	ID          string `json:"id"`
	DisplayName string `json:"displayName"`
	Email       string `json:"email"`
}

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if !h.setCORS(w, r) {
		http.Error(w, "origin not allowed", http.StatusForbidden)
		return
	}
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	switch strings.TrimPrefix(r.URL.Path, "/api/auth/") {
	case "register":
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		h.register(w, r)
	case "login":
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		h.login(w, r)
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
	default:
		http.NotFound(w, r)
	}
}

func (h *Handler) register(w http.ResponseWriter, r *http.Request) {
	var input credentials
	if !readJSON(w, r, &input) {
		return
	}

	input.DisplayName = strings.TrimSpace(input.DisplayName)
	input.Email = strings.ToLower(strings.TrimSpace(input.Email))
	if len(input.DisplayName) == 0 || len(input.DisplayName) > 60 {
		writeError(w, http.StatusBadRequest, "Display name must be between 1 and 60 characters.")
		return
	}
	if !validEmail(input.Email) {
		writeError(w, http.StatusBadRequest, "Enter a valid email address.")
		return
	}
	if len(input.Password) < 12 || len(input.Password) > 72 {
		writeError(w, http.StatusBadRequest, "Password must be between 12 and 72 bytes.")
		return
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Unable to create account.")
		return
	}

	userID, err := randomID()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Unable to create account.")
		return
	}
	identityID, err := randomID()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Unable to create account.")
		return
	}
	if err := h.store.CreatePasswordAccount(r.Context(), userID, identityID, input.DisplayName, input.Email, string(passwordHash)); err != nil {
		if errors.Is(err, db.ErrEmailTaken) {
			writeError(w, http.StatusConflict, "An account with this email already exists.")
			return
		}
		writeError(w, http.StatusInternalServerError, "Unable to create account.")
		return
	}

	user := db.AuthUser{ID: userID, DisplayName: input.DisplayName, Email: input.Email}
	if !h.startSession(w, r, user) {
		return
	}
	writeJSON(w, http.StatusCreated, accountResponse{ID: user.ID, DisplayName: user.DisplayName, Email: user.Email})
}

func (h *Handler) login(w http.ResponseWriter, r *http.Request) {
	var input credentials
	if !readJSON(w, r, &input) {
		return
	}

	input.Email = strings.ToLower(strings.TrimSpace(input.Email))
	if !validEmail(input.Email) || input.Password == "" || len(input.Password) > 72 {
		writeError(w, http.StatusUnauthorized, "Email or password is incorrect.")
		return
	}
	user, err := h.store.GetPasswordAccount(r.Context(), input.Email)
	if err != nil || bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Password)) != nil {
		writeError(w, http.StatusUnauthorized, "Email or password is incorrect.")
		return
	}
	if !h.startSession(w, r, user) {
		return
	}
	writeJSON(w, http.StatusOK, accountResponse{ID: user.ID, DisplayName: user.DisplayName, Email: user.Email})
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
	return true
}

func (h *Handler) sessionUser(w http.ResponseWriter, r *http.Request) (db.AuthUser, bool, bool) {
	cookie, err := r.Cookie(sessionCookieName)
	if err != nil {
		return db.AuthUser{}, false, false
	}
	user, err := h.store.GetSession(r.Context(), tokenHash(cookie.Value))
	if err != nil {
		if !errors.Is(err, pgx.ErrNoRows) {
			writeError(w, http.StatusInternalServerError, "Unable to check session.")
			return db.AuthUser{}, false, true
		}
		return db.AuthUser{}, false, false
	}
	return user, true, false
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
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Add("Vary", "Origin")
	}
	return true
}

func readJSON(w http.ResponseWriter, r *http.Request, target interface{}) bool {
	r.Body = http.MaxBytesReader(w, r.Body, 16*1024)
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(target); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body.")
		return false
	}
	if err := decoder.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
		writeError(w, http.StatusBadRequest, "Request body must contain a single JSON object.")
		return false
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
	secure := r.TLS != nil
	if origin, err := url.Parse(r.Header.Get("Origin")); err == nil && origin.Scheme == "https" {
		secure = true
	}
	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookieName,
		Value:    token,
		Path:     "/api/auth",
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteLaxMode,
		Expires:  expiresAt,
		MaxAge:   int(time.Until(expiresAt).Seconds()),
	})
}

func clearSessionCookie(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookieName,
		Value:    "",
		Path:     "/api/auth",
		HttpOnly: true,
		Secure:   r.TLS != nil,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1,
	})
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

func writeJSON(w http.ResponseWriter, status int, value interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}
