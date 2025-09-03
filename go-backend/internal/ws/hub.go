package ws

import (
	"encoding/json"
	"log"
)

type Room struct {
	clients map[*Client]bool
	entries []*PackingEntry
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

func (h *Hub) getOrCreateRoom(name string) *Room {
	room, ok := h.rooms[name]
	if !ok {
		room = &Room{
			clients: make(map[*Client]bool),
			entries: []*PackingEntry{},
		}
		h.rooms[name] = room
	}
	return room
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			room := h.getOrCreateRoom(client.room)
			room.clients[client] = true
			log.Printf("Client connected to room %s", client.room)

			snapshot := Envelope{
				Type:    "room_snapshot",
				Room:    client.room,
				Payload: room.entries,
			}
			data, _ := json.Marshal(snapshot)
			select {
			case client.send <- data:
			default:
				close(client.send)
				delete(room.clients, client)
			}

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
				room = h.getOrCreateRoom(message.Room)
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
