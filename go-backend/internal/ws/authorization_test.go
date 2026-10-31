package ws

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"go-backend/internal/auth"
	"go-backend/internal/db"

	"github.com/gorilla/websocket"
	"github.com/jackc/pgx/v5"
)

type sessionStore struct {
	hash []byte
	user db.AuthUser
}

func (s *sessionStore) GetOrCreateGoogleAccount(_ context.Context, userID, _ string, _, email, displayName string) (db.AuthUser, error) {
	return db.AuthUser{ID: userID, Email: email, DisplayName: displayName}, nil
}

func (s *sessionStore) CreateSession(context.Context, []byte, string, time.Time) error { return nil }

func (s *sessionStore) GetSession(_ context.Context, hash []byte) (db.AuthUser, error) {
	if string(hash) != string(s.hash) {
		return db.AuthUser{}, pgx.ErrNoRows
	}
	return s.user, nil
}

func (s *sessionStore) DeleteSession(context.Context, []byte) error { return nil }

func TestGuestsCanJoinButCannotChangeRoom(t *testing.T) {
	t.Setenv("FRONTEND_ORIGIN", "http://frontend.example")
	const sessionToken = "valid-session"
	sessionHash := sha256.Sum256([]byte(sessionToken))
	hub := NewHub(nil)
	hub.rooms["room-1"] = &Room{
		ID: "room-1", Name: "Weekend trip",
		clients: make(map[*Client]bool), participants: make(map[string]RoomUser),
		entries: []*PackingEntry{},
	}
	go hub.Run()

	store := sessionStore{
		hash: sessionHash[:],
		user: db.AuthUser{ID: "account-1", DisplayName: "Alex"},
	}
	server := httptest.NewServer(ServeWS(hub, auth.NewHandler(&store)))
	defer server.Close()
	websocketURL := "ws" + strings.TrimPrefix(server.URL, "http") + "/ws/?room=room-1"

	guest, _, err := websocket.DefaultDialer.Dial(websocketURL, http.Header{
		"Origin": []string{"http://frontend.example"},
	})
	if err != nil {
		t.Fatalf("connect as guest: %v", err)
	}
	defer guest.Close()
	if err := guest.WriteJSON(ClientMessage{
		Type: "join", RoomID: "room-1", ClientID: "guest-1", DisplayName: "Alex",
	}); err != nil {
		t.Fatalf("join room as guest: %v", err)
	}
	readEnvelope(t, guest)
	readEnvelope(t, guest)

	if err := guest.WriteJSON(ClientMessage{
		Type: "create_room", RoomID: "guest-room", RoomName: "Guest room",
	}); err != nil {
		t.Fatalf("send guest room creation: %v", err)
	}
	var createDenied Envelope
	readIntoEnvelope(t, guest, &createDenied)
	if createDenied.Type != "error" {
		t.Fatalf("expected guest room creation error, got %q", createDenied.Type)
	}
	if _, exists := hub.rooms["guest-room"]; exists {
		t.Fatal("guest created a room without an account")
	}

	if err := guest.WriteJSON(ClientMessage{
		Type: "add_entry", RoomID: "room-1",
		Entry: &PackingEntry{ID: "guest-item", Name: "Unauthorized item", Quantity: 1},
	}); err != nil {
		t.Fatalf("send guest item: %v", err)
	}
	var denied Envelope
	readIntoEnvelope(t, guest, &denied)
	if denied.Type != "error" {
		t.Fatalf("expected guest action error, got %q", denied.Type)
	}
	payload, ok := denied.Payload.(map[string]interface{})
	if !ok || payload["type"] != "authentication_required" {
		t.Fatalf("expected authentication_required error, got %#v", denied.Payload)
	}
	if count := len(hub.rooms["room-1"].entries); count != 0 {
		t.Fatalf("guest mutation changed room state: %d entries", count)
	}

	account, _, err := websocket.DefaultDialer.Dial(websocketURL, http.Header{
		"Origin": []string{"http://frontend.example"},
		"Cookie": []string{auth.SessionCookieName + "=" + sessionToken},
	})
	if err != nil {
		t.Fatalf("connect as account: %v", err)
	}
	defer account.Close()
	if err := account.WriteJSON(ClientMessage{
		Type: "join", RoomID: "room-1", ClientID: "spoofed-id", DisplayName: "Spoofed name",
	}); err != nil {
		t.Fatalf("join room as account: %v", err)
	}
	readEnvelope(t, account)
	readEnvelope(t, account)

	if err := account.WriteJSON(ClientMessage{
		Type: "add_entry", RoomID: "room-1",
		Entry: &PackingEntry{ID: "account-item", Name: "Tent", Quantity: 1},
	}); err != nil {
		t.Fatalf("send account item: %v", err)
	}
	var added Envelope
	readIntoEnvelope(t, account, &added)
	if added.Type != "entry_added" || added.Entry == nil || added.Entry.ID != "account-item" {
		t.Fatalf("expected authenticated item update, got %+v", added)
	}
	if count := len(hub.rooms["room-1"].entries); count != 1 {
		t.Fatalf("expected authenticated mutation to update room state, got %d entries", count)
	}

	creatorURL := "ws" + strings.TrimPrefix(server.URL, "http") + "/ws/?room=account-room"
	creator, _, err := websocket.DefaultDialer.Dial(creatorURL, http.Header{
		"Origin": []string{"http://frontend.example"},
		"Cookie": []string{auth.SessionCookieName + "=" + sessionToken},
	})
	if err != nil {
		t.Fatalf("connect to create room: %v", err)
	}
	defer creator.Close()
	if err := creator.WriteJSON(ClientMessage{
		Type: "create_room", RoomID: "account-room", RoomName: "Account room",
	}); err != nil {
		t.Fatalf("send authenticated room creation: %v", err)
	}
	readEnvelope(t, creator)
	readEnvelope(t, creator)
	if room, exists := hub.rooms["account-room"]; !exists || room.Name != "Account room" {
		t.Fatalf("expected authenticated user to create room, got %+v", room)
	}

	store.hash = nil
	if err := account.WriteJSON(ClientMessage{Type: "delete_entry", RoomID: "room-1", EntryID: "account-item"}); err != nil {
		t.Fatalf("send action after session revocation: %v", err)
	}
	var revoked Envelope
	readIntoEnvelope(t, account, &revoked)
	if revoked.Type != "error" {
		t.Fatalf("expected revoked session error, got %q", revoked.Type)
	}
	if count := len(hub.rooms["room-1"].entries); count != 1 {
		t.Fatalf("revoked session changed room state: %d entries", count)
	}
}

func readEnvelope(t *testing.T, conn *websocket.Conn) Envelope {
	t.Helper()
	var message Envelope
	readIntoEnvelope(t, conn, &message)
	return message
}

func readIntoEnvelope(t *testing.T, conn *websocket.Conn, message *Envelope) {
	t.Helper()
	_ = conn.SetReadDeadline(time.Now().Add(2 * time.Second))
	_, data, err := conn.ReadMessage()
	if err != nil {
		t.Fatalf("read WebSocket message: %v", err)
	}
	if err := json.Unmarshal(data, message); err != nil {
		t.Fatalf("decode WebSocket message: %v", err)
	}
}
