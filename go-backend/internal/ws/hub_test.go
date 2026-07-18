package ws

import (
	"encoding/json"
	"testing"
	"time"
)

func TestCreateRoomAndAddEntries(t *testing.T) {
	hub := NewHub()
	go hub.Run()

	creator := &Client{send: make(chan []byte, 10)}
	room := hub.createRoom("room123", "My Trip", "100", "Beach getaway", "2026-07-20", "user-uuid-1", "Alice", creator)
	if room == nil {
		t.Fatal("expected room to be created")
	}

	select {
	case message := <-creator.send:
		var snapshot Envelope
		if err := json.Unmarshal(message, &snapshot); err != nil {
			t.Fatalf("failed to unmarshal room snapshot: %v", err)
		}

		payload, ok := snapshot.Payload.(map[string]interface{})
		if !ok {
			t.Fatalf("expected room snapshot payload to be a map, got %T", snapshot.Payload)
		}

		if payload["roomName"] != "My Trip" {
			t.Fatalf("expected room name to be persisted, got %v", payload["roomName"])
		}
		if payload["budget"] != "100" {
			t.Fatalf("expected budget to be persisted, got %v", payload["budget"])
		}
		if payload["description"] != "Beach getaway" {
			t.Fatalf("expected description to be persisted, got %v", payload["description"])
		}
		if payload["date"] != "2026-07-20" {
			t.Fatalf("expected date to be persisted, got %v", payload["date"])
		}
	default:
		t.Fatal("expected initial room snapshot to be sent")
	}

	entries := []*PackingEntry{
		{ID: "1", Name: "Passport", Quantity: 1, Cost: 12.5, AssignedTo: "Me"},
		{ID: "2", Name: "Sunscreen", Quantity: 2, Cost: 8, AssignedTo: "Alex"},
		{ID: "3", Name: "Swimsuit", Quantity: 1, Cost: 24, AssignedTo: "Unassigned"},
	}

	for _, entry := range entries {
		hub.broadcast <- Envelope{Type: "entry_added", Room: room.ID, Entry: entry}
	}

	for i, entry := range entries {
		select {
		case message := <-creator.send:
			var envelope Envelope
			if err := json.Unmarshal(message, &envelope); err != nil {
				t.Fatalf("failed to unmarshal entry event %d: %v", i+1, err)
			}
			if envelope.Type != "entry_added" {
				t.Fatalf("expected entry_added event, got %s", envelope.Type)
			}
			if envelope.Entry == nil || envelope.Entry.Name != entry.Name {
				t.Fatalf("expected entry %q to be broadcast, got %+v", entry.Name, envelope.Entry)
			}
		case <-time.After(200 * time.Millisecond):
			t.Fatalf("expected entry event %d to be broadcast", i+1)
		}
	}

	if len(room.entries) != len(entries) {
		t.Fatalf("expected %d entries in room, got %d", len(entries), len(room.entries))
	}
}
