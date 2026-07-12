package ws

import (
	"encoding/json"
	"log"
)

type Room struct {
	ID          string
	Name        string
	Budget      string
	Description string
	Date        string
	clients     map[*Client]bool
	entries     []*PackingEntry
}

type Hub struct {
	rooms map[string]*Room

	register   chan *Client
	unregister chan *Client
	broadcast  chan Envelope
}

func NewHub() *Hub {
	return &Hub{
		rooms:      make(map[string]*Room),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan Envelope),
	}
}

func (h *Hub) createRoom(id, name, budget, description, date string, client *Client) *Room {
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
		// Room already exists, just join
		room.clients[client] = true
		// Send snapshot to client
		snapshot := Envelope{
			Type: "room_snapshot",
			Room: id,
			Payload: map[string]interface{}{
				"entries":     room.entries,
				"roomName":    room.Name,
				"budget":      room.Budget,
				"description": room.Description,
				"date":        room.Date,
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

	// Room does not exist, create it
	room := &Room{
		ID:          id,
		Name:        name,
		Budget:      budget,
		Description: description,
		Date:        date,
		clients:     make(map[*Client]bool),
		entries:     []*PackingEntry{},
	}
	h.rooms[id] = room
	room.clients[client] = true

	// Send snapshot to client
	snapshot := Envelope{
		Type: "room_snapshot",
		Room: id,
		Payload: map[string]interface{}{
			"entries":     room.entries,
			"roomName":    room.Name,
			"budget":      room.Budget,
			"description": room.Description,
			"date":        room.Date,
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

func (h *Hub) joinRoom(id string, client *Client) *Room {
	room, ok := h.rooms[id]
	if !ok {
		// Room doesn't exist, return nil
		return nil
	}

	room.clients[client] = true

	// Send room snapshot to the client
	snapshot := Envelope{
		Type: "room_snapshot",
		Room: id,
		Payload: map[string]interface{}{
			"entries":     room.entries,
			"roomName":    room.Name,
			"budget":      room.Budget,
			"description": room.Description,
			"date":        room.Date,
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
