package ws

import (
	"context"
	"encoding/json"
	"log"

	"go-backend/internal/db"
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
	store *db.Store

	register   chan *Client
	unregister chan *Client
	broadcast  chan Envelope
}

func NewHub(store *db.Store) *Hub {
	return &Hub{
		rooms:      make(map[string]*Room),
		store:      store,
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan Envelope),
	}
}

func (h *Hub) loadRoomFromStore(id string) *Room {
	if h.store == nil {
		return nil
	}

	found, name, budget, description, date, entries, err := h.store.GetRoom(context.Background(), id)
	if err != nil {
		log.Printf("load room %s from database: %v", id, err)
		return nil
	}
	if !found {
		return nil
	}

	room := &Room{
		ID:          id,
		Name:        name,
		Budget:      budget,
		Description: description,
		Date:        date,
		clients:     make(map[*Client]bool),
		entries:     make([]*PackingEntry, 0, len(entries)),
	}
	for _, entry := range entries {
		room.entries = append(room.entries, &PackingEntry{
			ID:         entry.ID,
			Name:       entry.Name,
			Quantity:   entry.Quantity,
			Cost:       entry.Cost,
			AssignedTo: entry.AssignedTo,
		})
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
	); err != nil {
		log.Printf("save room %s to database: %v", room.ID, err)
	}
}

func (h *Hub) persistEntry(roomID string, entry *PackingEntry) {
	if h.store == nil || entry == nil {
		return
	}

	if err := h.store.AddEntry(context.Background(), roomID, db.Entry{
		ID:         entry.ID,
		Name:       entry.Name,
		Quantity:   entry.Quantity,
		Cost:       entry.Cost,
		AssignedTo: entry.AssignedTo,
	}); err != nil {
		log.Printf("save entry %s to database: %v", entry.ID, err)
	}
}

func (h *Hub) createRoom(id, name, budget, description, date string, client *Client) *Room {
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
		room.clients[client] = true
		h.sendRoomSnapshot(room, client)
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
	h.persistRoom(room)
	room.clients[client] = true

	h.sendRoomSnapshot(room, client)
	return room
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

func (h *Hub) joinRoom(id string, client *Client) *Room {
	room, ok := h.rooms[id]
	if !ok {
		room = h.loadRoomFromStore(id)
		if room == nil {
			return nil
		}
	}

	room.clients[client] = true
	h.sendRoomSnapshot(room, client)
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
				h.persistEntry(message.Room, message.Entry)
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
