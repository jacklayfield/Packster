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
	room, reason := hub.createRoom("room123", "My Trip", "100", "Beach getaway", "2026-07-20", existing)
	if reason != "" {
		t.Fatalf("failed to create room: %s", reason)
	}
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
	joined, reason := hub.joinRoom("room123", joiner)
	if reason != "" {
		t.Fatalf("failed to join room: %s", reason)
	}
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

func TestDuplicateDisplayNamesHaveDistinctParticipants(t *testing.T) {
	hub := NewHub(nil)

	first := &Client{
		send:        make(chan []byte, 10),
		id:          "client-a",
		displayName: "Alex",
		color:       colorFromClientID("client-a"),
	}
	if _, reason := hub.createRoom("room123", "My Trip", "", "", "", first); reason != "" {
		t.Fatalf("failed to create room: %s", reason)
	}

	second := &Client{
		send:        make(chan []byte, 10),
		id:          "client-b",
		displayName: " alex ",
		color:       colorFromClientID("client-b"),
	}
	joined, reason := hub.joinRoom("room123", second)
	if reason != "" || joined == nil {
		t.Fatalf("expected duplicate display name to join as a separate participant, room=%v error=%q", joined, reason)
	}
	if len(joined.participants) != 2 {
		t.Fatalf("expected two distinct participants, got %d", len(joined.participants))
	}
}

func TestCreateRoomRecordsCreatorAsOwner(t *testing.T) {
	hub := NewHub(nil)
	creator := &Client{
		id: "account-1", accountID: "account-1", send: make(chan []byte, 2),
	}
	room, reason := hub.createRoom("room-1", "Weekend trip", "", "", "", creator)
	if reason != "" {
		t.Fatalf("failed to create room: %s", reason)
	}
	if room.OwnerID != creator.accountID {
		t.Fatalf("expected room owner %q, got %q", creator.accountID, room.OwnerID)
	}

	var snapshot Envelope
	if err := json.Unmarshal(<-creator.send, &snapshot); err != nil {
		t.Fatalf("failed to unmarshal room snapshot: %v", err)
	}
	payload, ok := snapshot.Payload.(map[string]interface{})
	if !ok || payload["ownerId"] != creator.accountID {
		t.Fatalf("expected room snapshot owner %q, got %#v", creator.accountID, snapshot.Payload)
	}
}

func TestRemoveRoomMemberRequiresOwnerAndUnclaimsEntries(t *testing.T) {
	hub := NewHub(nil)
	owner := &Client{id: "owner-1", send: make(chan []byte, 10)}
	room := &Room{
		ID: "room-1", OwnerID: owner.id,
		clients: map[*Client]bool{owner: true},
		participants: map[string]RoomUser{
			owner.id: {ClientID: owner.id, DisplayName: "Owner"},
			"member": {ClientID: "member", DisplayName: "Member"},
		},
		entries: []*PackingEntry{
			{ID: "entry-1", Name: "Tent", AssignedTo: "Member", AssignedToID: "member"},
			{ID: "entry-2", Name: "Food", AssignedTo: "Owner", AssignedToID: owner.id},
		},
	}
	hub.rooms[room.ID] = room

	unauthorized := &Client{send: make(chan []byte, 1)}
	hub.removeRoomMember(memberRemovalRequest{
		roomID: room.ID, memberID: "member", accountID: "other", requester: unauthorized,
	})
	if _, exists := room.participants["member"]; !exists {
		t.Fatal("non-owner removed a room member")
	}
	if room.entries[0].AssignedToID != "member" {
		t.Fatal("non-owner removal changed the member's claim")
	}

	hub.removeRoomMember(memberRemovalRequest{
		roomID: room.ID, memberID: "member", accountID: owner.id, requester: owner,
	})
	if _, exists := room.participants["member"]; exists {
		t.Fatal("owner removal left the member in the room")
	}
	if room.entries[0].AssignedTo != "Unassigned" || room.entries[0].AssignedToID != "" {
		t.Fatalf("expected removed member's claim to be cleared, got %+v", room.entries[0])
	}
	if room.entries[1].AssignedToID != owner.id {
		t.Fatal("removing a member changed another participant's claim")
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
