package ws

import (
	"encoding/json"
	"testing"
	"time"
)

func TestPresenceOnJoin(t *testing.T) {
	hub := NewHub(nil)
	go hub.Run()

	existing := &Client{
		send:        make(chan []byte, 10),
		id:          "client-a",
		displayName: "Alex",
		color:       colorFromClientID("client-a"),
	}
	room := hub.createRoom("room123", "My Trip", "100", "Beach getaway", "2026-07-20", existing)
	if room == nil {
		t.Fatal("expected room to be created")
	}

	drainChannel(existing.send, 2)

	joiner := &Client{
		send:        make(chan []byte, 10),
		id:          "client-b",
		displayName: "Jamie",
		color:       colorFromClientID("client-b"),
	}
	joined := hub.joinRoom("room123", joiner)
	if joined == nil {
		t.Fatal("expected room join to succeed")
	}

	var joinerSnapshot Envelope
	select {
	case message := <-joiner.send:
		if err := json.Unmarshal(message, &joinerSnapshot); err != nil {
			t.Fatalf("failed to unmarshal joiner message: %v", err)
		}
	default:
		t.Fatal("expected joiner to receive messages")
	}

	if joinerSnapshot.Type != "room_snapshot" {
		t.Fatalf("expected room snapshot first, got %s", joinerSnapshot.Type)
	}

	var presenceSnapshot Envelope
	select {
	case message := <-joiner.send:
		if err := json.Unmarshal(message, &presenceSnapshot); err != nil {
			t.Fatalf("failed to unmarshal presence snapshot: %v", err)
		}
	default:
		t.Fatal("expected presence snapshot for joiner")
	}

	if presenceSnapshot.Type != "presence_snapshot" {
		t.Fatalf("expected presence snapshot, got %s", presenceSnapshot.Type)
	}

	var userJoined Envelope
	select {
	case message := <-existing.send:
		if err := json.Unmarshal(message, &userJoined); err != nil {
			t.Fatalf("failed to unmarshal user joined message: %v", err)
		}
	case <-time.After(200 * time.Millisecond):
		t.Fatal("expected existing client to receive user_joined")
	}

	if userJoined.Type != "user_joined" {
		t.Fatalf("expected user_joined, got %s", userJoined.Type)
	}

	hub.unregister <- joiner
	time.Sleep(50 * time.Millisecond)

	var userLeft Envelope
	select {
	case message := <-existing.send:
		if err := json.Unmarshal(message, &userLeft); err != nil {
			t.Fatalf("failed to unmarshal user left message: %v", err)
		}
	default:
		t.Fatal("expected existing client to receive user_left")
	}

	if userLeft.Type != "user_left" {
		t.Fatalf("expected user_left, got %s", userLeft.Type)
	}
}

func drainChannel(ch <-chan []byte, count int) {
	for i := 0; i < count; i++ {
		select {
		case <-ch:
		case <-time.After(200 * time.Millisecond):
			return
		}
	}
}
