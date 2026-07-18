package ws

import (
	"encoding/json"
	"log"
	"time"
)

type Room struct {
	ID          string
	Name        string
	Budget      string
	Description string
	Date        string
	OwnerID     string                 // UUID of the room creator
	clients     map[*Client]bool       // Active WebSocket connections
	memberships map[string]*Membership // UserID -> Membership
	entries     []*PackingEntry
	inviteToken string
}

type Hub struct {
	rooms       map[string]*Room
	users       map[string]*User       // Track user info
	inviteLinks map[string]*InviteLink // Token -> InviteLink
	register    chan *Client
	unregister  chan *Client
	broadcast   chan Envelope
}

func NewHub() *Hub {
	return &Hub{
		rooms:       make(map[string]*Room),
		users:       make(map[string]*User),
		inviteLinks: make(map[string]*InviteLink),
		register:    make(chan *Client),
		unregister:  make(chan *Client),
		broadcast:   make(chan Envelope),
	}
}

func (h *Hub) createRoom(id, name, budget, description, date, userID, displayName string, client *Client) *Room {
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
		// Room already exists, add user to membership if not already
		room.clients[client] = true
		if _, ok := room.memberships[userID]; !ok {
			h.addMembership(id, userID, displayName)
		}

		// Send snapshot to client with members
		snapshot := Envelope{
			Type: "room_snapshot",
			Room: id,
			Payload: map[string]interface{}{
				"entries":     room.entries,
				"roomName":    room.Name,
				"budget":      room.Budget,
				"description": room.Description,
				"date":        room.Date,
				"members":     h.getMembers(id),
			},
		}
		data, _ := json.Marshal(snapshot)
		select {
		case client.send <- data:
		default:
			close(client.send)
			delete(room.clients, client)
		}
		return room
	}

	// Room does not exist, create it with owner
	room := &Room{
		ID:          id,
		Name:        name,
		Budget:      budget,
		Description: description,
		Date:        date,
		OwnerID:     userID,
		clients:     make(map[*Client]bool),
		memberships: make(map[string]*Membership),
		entries:     []*PackingEntry{},
	}
	h.rooms[id] = room
	room.clients[client] = true

	// Add creator as member
	h.addMembership(id, userID, displayName)

	// Send snapshot to client with members
	snapshot := Envelope{
		Type: "room_snapshot",
		Room: id,
		Payload: map[string]interface{}{
			"entries":     room.entries,
			"roomName":    room.Name,
			"budget":      room.Budget,
			"description": room.Description,
			"date":        room.Date,
			"members":     h.getMembers(id),
		},
	}
	data, _ := json.Marshal(snapshot)
	select {
	case client.send <- data:
	default:
		close(client.send)
		delete(room.clients, client)
	}

	return room
}

func (h *Hub) joinRoom(id, userID, displayName string, client *Client) *Room {
	room, ok := h.rooms[id]
	if !ok {
		// Room doesn't exist, return nil
		return nil
	}

	room.clients[client] = true

	// Add user to membership if not already
	if _, ok := room.memberships[userID]; !ok {
		h.addMembership(id, userID, displayName)
	}

	// Send room snapshot to the client with members
	snapshot := Envelope{
		Type: "room_snapshot",
		Room: id,
		Payload: map[string]interface{}{
			"entries":     room.entries,
			"roomName":    room.Name,
			"budget":      room.Budget,
			"description": room.Description,
			"date":        room.Date,
			"members":     h.getMembers(id),
		},
	}
	data, _ := json.Marshal(snapshot)
	select {
	case client.send <- data:
	default:
		close(client.send)
		delete(room.clients, client)
	}

	// Broadcast user joined message to all clients in room
	userJoinedMsg := Envelope{
		Type:   "user_joined",
		Room:   id,
		UserID: userID,
		Payload: map[string]interface{}{
			"displayName": displayName,
		},
	}
	data, _ = json.Marshal(userJoinedMsg)
	for c := range room.clients {
		if c != client { // Don't send back to the joining user
			select {
			case c.send <- data:
			default:
				close(c.send)
				delete(room.clients, c)
			}
		}
	}

	return room
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
				room.entries = append(room.entries, message.Entry)
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
	}
}

// addMembership adds a user to a room's membership
func (h *Hub) addMembership(roomID, userID, displayName string) *Membership {
	room, ok := h.rooms[roomID]
	if !ok {
		return nil
	}

	membership := &Membership{
		UserID:      userID,
		DisplayName: displayName,
		JoinedAt:    time.Now(),
	}
	room.memberships[userID] = membership
	return membership
}

// getMembership retrieves a user's membership in a room
func (h *Hub) getMembership(roomID, userID string) *Membership {
	room, ok := h.rooms[roomID]
	if !ok {
		return nil
	}
	return room.memberships[userID]
}

// getMembers returns all members of a room
func (h *Hub) getMembers(roomID string) []*Membership {
	room, ok := h.rooms[roomID]
	if !ok {
		return nil
	}

	members := make([]*Membership, 0, len(room.memberships))
	for _, m := range room.memberships {
		members = append(members, m)
	}
	return members
}

// createInviteLink generates a new invite link for a room
func (h *Hub) createInviteLink(roomID string) *InviteLink {
	token := generateToken()
	inviteLink := &InviteLink{
		Token:     token,
		TripID:    roomID,
		CreatedAt: time.Now(),
		ExpiresAt: time.Now().Add(24 * 7 * time.Hour), // 7 days
	}
	h.inviteLinks[token] = inviteLink
	return inviteLink
}

// getInviteLink retrieves invite link details
func (h *Hub) getInviteLink(token string) *InviteLink {
	invite, ok := h.inviteLinks[token]
	if !ok || time.Now().After(invite.ExpiresAt) {
		return nil
	}
	return invite
}
