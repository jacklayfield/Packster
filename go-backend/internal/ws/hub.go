package ws

import (
	"context"
	"encoding/json"
	"log"

	"go-backend/internal/db"
)

type Room struct {
	ID           string
	Name         string
	Budget       string
	Description  string
	Date         string
	OwnerID      string
	clients      map[*Client]bool
	participants map[string]RoomUser
	entries      []*PackingEntry
}

type memberRemovalRequest struct {
	roomID    string
	memberID  string
	accountID string
	requester *Client
}

type roomDeletionRequest struct {
	roomID  string
	ownerID string
	result  chan roomDeletionResult
}

type roomDeletionResult struct {
	deleted bool
	err     error
}

type Hub struct {
	rooms map[string]*Room
	store *db.Store

	register     chan *Client
	unregister   chan *Client
	broadcast    chan Envelope
	removeMember chan memberRemovalRequest
	deleteRoom   chan roomDeletionRequest
}

func NewHub(store *db.Store) *Hub {
	return &Hub{
		rooms:        make(map[string]*Room),
		store:        store,
		register:     make(chan *Client),
		unregister:   make(chan *Client),
		broadcast:    make(chan Envelope),
		removeMember: make(chan memberRemovalRequest),
		deleteRoom:   make(chan roomDeletionRequest),
	}
}

func (h *Hub) DeleteRoom(ctx context.Context, roomID, ownerID string) (bool, error) {
	request := roomDeletionRequest{
		roomID:  roomID,
		ownerID: ownerID,
		result:  make(chan roomDeletionResult, 1),
	}
	select {
	case h.deleteRoom <- request:
	case <-ctx.Done():
		return false, ctx.Err()
	}
	select {
	case result := <-request.result:
		return result.deleted, result.err
	case <-ctx.Done():
		return false, ctx.Err()
	}
}

func (h *Hub) removeStaleClients(room *Room, clientID string, keep *Client) {
	for client := range room.clients {
		if client.id == clientID && client != keep {
			delete(room.clients, client)
			close(client.send)
		}
	}
}

func (h *Hub) roomUsers(room *Room) []RoomUser {
	users := make([]RoomUser, 0, len(room.participants))
	for _, user := range room.participants {
		user.Online = false
		for client := range room.clients {
			if client.id == user.ClientID {
				user.Online = true
				break
			}
		}
		users = append(users, user)
	}
	return users
}

func (h *Hub) sendPresenceSnapshot(room *Room, client *Client) {
	if client.id == "" || client.displayName == "" {
		return
	}

	snapshot := Envelope{
		Type: "presence_snapshot",
		Room: room.ID,
		Payload: map[string]interface{}{
			"users": h.roomUsers(room),
		},
	}
	data, _ := json.Marshal(snapshot)
	select {
	case client.send <- data:
	default:
		close(client.send)
		delete(room.clients, client)
	}
}

func (h *Hub) broadcastUserJoined(room *Room, joined *Client) {
	if joined.id == "" || joined.displayName == "" {
		return
	}

	user := joined.roomUser()
	user.Online = true
	message := Envelope{
		Type: "user_joined",
		Room: room.ID,
		Payload: map[string]interface{}{
			"user": user,
		},
	}
	data, _ := json.Marshal(message)
	for client := range room.clients {
		if client == joined {
			continue
		}
		select {
		case client.send <- data:
		default:
			close(client.send)
			delete(room.clients, client)
		}
	}
}

func (h *Hub) broadcastUserLeft(room *Room, left *Client) {
	if left.id == "" {
		return
	}

	message := Envelope{
		Type: "user_left",
		Room: room.ID,
		Payload: map[string]interface{}{
			"clientId": left.id,
		},
	}
	data, _ := json.Marshal(message)
	for client := range room.clients {
		select {
		case client.send <- data:
		default:
			close(client.send)
			delete(room.clients, client)
		}
	}
}

func (h *Hub) announcePresence(room *Room, client *Client) {
	h.sendPresenceSnapshot(room, client)
	h.broadcastUserJoined(room, client)
}

func (h *Hub) addClientToRoom(room *Room, client *Client) {
	room.clients[client] = true
	if client.id != "" && client.displayName != "" {
		user := client.roomUser()
		user.Online = true
		room.participants[client.id] = user
		if h.store != nil {
			if err := h.store.UpsertParticipant(context.Background(), room.ID, db.Participant{
				ClientID: client.id, DisplayName: client.displayName, Color: client.color,
			}); err != nil {
				log.Printf("save participant %s to room %s: %v", client.id, room.ID, err)
			}
		}
	}
}

func (h *Hub) loadRoomFromStore(id string) *Room {
	if h.store == nil {
		return nil
	}

	found, name, budget, description, date, ownerID, entries, err := h.store.GetRoom(context.Background(), id)
	if err != nil {
		log.Printf("load room %s from database: %v", id, err)
		return nil
	}
	if !found {
		return nil
	}

	room := &Room{
		ID:           id,
		Name:         name,
		Budget:       budget,
		Description:  description,
		Date:         date,
		OwnerID:      ownerID,
		clients:      make(map[*Client]bool),
		participants: make(map[string]RoomUser),
		entries:      make([]*PackingEntry, 0, len(entries)),
	}
	for _, entry := range entries {
		room.entries = append(room.entries, &PackingEntry{
			ID:           entry.ID,
			Name:         entry.Name,
			Quantity:     entry.Quantity,
			Cost:         entry.Cost,
			AssignedTo:   entry.AssignedTo,
			AssignedToID: entry.AssignedToID,
		})
	}
	participants, err := h.store.GetParticipants(context.Background(), id)
	if err != nil {
		log.Printf("load participants for room %s: %v", id, err)
	} else {
		for _, participant := range participants {
			room.participants[participant.ClientID] = RoomUser{ClientID: participant.ClientID, DisplayName: participant.DisplayName, Color: participant.Color}
		}
	}
	h.rooms[id] = room
	return room
}

func (h *Hub) persistRoom(room *Room) {
	if h.store == nil {
		return
	}

	if err := h.store.UpsertRoom(
		context.Background(),
		room.ID,
		room.Name,
		room.Budget,
		room.Description,
		room.Date,
		room.OwnerID,
	); err != nil {
		log.Printf("save room %s to database: %v", room.ID, err)
	}
}

func (h *Hub) persistEntry(roomID string, entry *PackingEntry) {
	if h.store == nil || entry == nil {
		return
	}

	if err := h.store.AddEntry(context.Background(), roomID, db.Entry{
		ID:           entry.ID,
		Name:         entry.Name,
		Quantity:     entry.Quantity,
		Cost:         entry.Cost,
		AssignedTo:   entry.AssignedTo,
		AssignedToID: entry.AssignedToID,
	}); err != nil {
		log.Printf("save entry %s to database: %v", entry.ID, err)
	}
}

func (h *Hub) createRoom(id, name, budget, description, date string, client *Client) (*Room, string) {
	client.room = id
	if _, exists := h.rooms[id]; !exists {
		h.loadRoomFromStore(id)
	}

	if room, exists := h.rooms[id]; exists {
		if name != "" {
			room.Name = name
		}
		if budget != "" {
			room.Budget = budget
		}
		if description != "" {
			room.Description = description
		}
		if date != "" {
			room.Date = date
		}
		h.persistRoom(room)
		h.addClientToRoom(room, client)
		h.sendRoomSnapshot(room, client)
		h.announcePresence(room, client)
		return room, ""
	}

	// Room does not exist, create it
	room := &Room{
		ID:           id,
		Name:         name,
		Budget:       budget,
		Description:  description,
		Date:         date,
		OwnerID:      client.accountID,
		clients:      make(map[*Client]bool),
		participants: make(map[string]RoomUser),
		entries:      []*PackingEntry{},
	}
	h.rooms[id] = room
	h.persistRoom(room)
	h.addClientToRoom(room, client)

	h.sendRoomSnapshot(room, client)
	h.announcePresence(room, client)
	return room, ""
}

func (h *Hub) sendRoomSnapshot(room *Room, client *Client) {
	snapshot := Envelope{
		Type: "room_snapshot",
		Room: room.ID,
		Payload: map[string]interface{}{
			"entries":     room.entries,
			"roomName":    room.Name,
			"budget":      room.Budget,
			"description": room.Description,
			"date":        room.Date,
			"ownerId":     room.OwnerID,
		},
	}
	data, _ := json.Marshal(snapshot)
	log.Printf("Sending room_snapshot for room %s to client %s", room.ID, client.id)
	select {
	case client.send <- data:
		log.Printf("Successfully sent room_snapshot")
	default:
		log.Printf("ERROR: Failed to send room_snapshot - channel full or closed")
		close(client.send)
		delete(room.clients, client)
	}
}

func (h *Hub) joinRoom(id string, client *Client) (*Room, string) {
	log.Printf("joinRoom called for room %s", id)
	client.room = id
	room, ok := h.rooms[id]
	if !ok {
		log.Printf("Room %s not in memory, loading from store", id)
		room = h.loadRoomFromStore(id)
		if room == nil {
			log.Printf("Room %s not found in store", id)
			return nil, "Room not found"
		}
		log.Printf("Loaded room %s from store", id)
	}

	h.addClientToRoom(room, client)
	log.Printf("Client %s added to room %s", client.id, id)
	h.sendRoomSnapshot(room, client)
	h.announcePresence(room, client)
	return room, ""
}

func (h *Hub) broadcastToRoom(room *Room, message Envelope) {
	data, _ := json.Marshal(message)
	for client := range room.clients {
		select {
		case client.send <- data:
		default:
			close(client.send)
			delete(room.clients, client)
		}
	}
}

func (h *Hub) removeRoomMember(request memberRemovalRequest) {
	room, exists := h.rooms[request.roomID]
	if !exists {
		request.requester.sendError("Room not found")
		return
	}
	if request.accountID == "" || request.accountID != room.OwnerID {
		request.requester.sendError("Only the room owner can remove members.")
		return
	}
	if request.memberID == "" || request.memberID == room.OwnerID {
		request.requester.sendError("The room owner cannot be removed.")
		return
	}
	if _, exists := room.participants[request.memberID]; !exists {
		request.requester.sendError("Member not found")
		return
	}

	var updatedEntries []*PackingEntry
	for _, entry := range room.entries {
		if entry.AssignedToID == request.memberID {
			entry.AssignedTo = "Unassigned"
			entry.AssignedToID = ""
			updatedEntries = append(updatedEntries, entry)
			h.persistEntry(room.ID, entry)
		}
	}
	delete(room.participants, request.memberID)
	if h.store != nil {
		if err := h.store.DeleteParticipant(context.Background(), room.ID, request.memberID); err != nil {
			log.Printf("delete participant %s from room %s: %v", request.memberID, room.ID, err)
		}
	}

	for client := range room.clients {
		if client.id == request.memberID {
			delete(room.clients, client)
			close(client.send)
		}
	}
	for _, entry := range updatedEntries {
		h.broadcastToRoom(room, Envelope{Type: "entry_added", Room: room.ID, Entry: entry})
	}
	h.broadcastToRoom(room, Envelope{
		Type:    "member_removed",
		Room:    room.ID,
		Payload: map[string]string{"clientId": request.memberID},
	})
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			// Client is registered but room will be created/joined via message
			log.Printf("Client connected with room ID %s", client.room)

		case client := <-h.unregister:
			if room, ok := h.rooms[client.room]; ok {
				if _, exists := room.clients[client]; exists {
					delete(room.clients, client)
					close(client.send)
					stillOnline := false
					for other := range room.clients {
						if other.id == client.id {
							stillOnline = true
							break
						}
					}
					if !stillOnline {
						if participant, exists := room.participants[client.id]; exists {
							participant.Online = false
							room.participants[client.id] = participant
						}
						h.broadcastUserLeft(room, client)
					}
				}
			}

		case message := <-h.broadcast:
			room, ok := h.rooms[message.Room]
			if !ok {
				// Room doesn't exist, this shouldn't happen in normal flow
				log.Printf("Room %s not found", message.Room)
				continue
			}

			if message.Type == "entry_added" && message.Entry != nil {
				updated := false
				for i, current := range room.entries {
					if current.ID == message.Entry.ID {
						room.entries[i] = message.Entry
						updated = true
						break
					}
				}
				if !updated {
					room.entries = append(room.entries, message.Entry)
				}
				h.persistEntry(message.Room, message.Entry)
			} else if message.Type == "entry_deleted" && message.EntryID != "" {
				// Remove entry from room in memory
				entryID := message.EntryID
				newEntries := make([]*PackingEntry, 0, len(room.entries))
				for _, e := range room.entries {
					if e.ID == entryID {
						continue
					}
					newEntries = append(newEntries, e)
				}
				room.entries = newEntries
				// Persist deletion in store
				if h.store != nil {
					if err := h.store.DeleteEntry(context.Background(), message.Room, entryID); err != nil {
						log.Printf("delete entry %s from db: %v", entryID, err)
					}
				}
			}

			data, _ := json.Marshal(message)
			for client := range room.clients {
				select {
				case client.send <- data:
				default:
					close(client.send)
					delete(room.clients, client)
				}
			}

		case request := <-h.removeMember:
			h.removeRoomMember(request)

		case request := <-h.deleteRoom:
			deleted, err := h.store.DeleteOwnedRoom(context.Background(), request.roomID, request.ownerID)
			if err == nil && deleted {
				if room, exists := h.rooms[request.roomID]; exists {
					message, _ := json.Marshal(Envelope{
						Type:    "error",
						Room:    request.roomID,
						Payload: "This room has been deleted.",
					})
					for client := range room.clients {
						select {
						case client.send <- message:
						default:
						}
						close(client.send)
						delete(room.clients, client)
					}
					delete(h.rooms, request.roomID)
				}
			}
			request.result <- roomDeletionResult{deleted: deleted, err: err}
		}
	}
}
