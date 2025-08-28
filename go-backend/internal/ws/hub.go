package ws

import (
	"encoding/json"
	"log"
)

type Hub struct {
	rooms map[string]map[*Client]bool

	register   chan *Client
	unregister chan *Client
	broadcast  chan Envelope
}

func NewHub() *Hub {
	return &Hub{
		rooms:      make(map[string]map[*Client]bool),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan Envelope),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			if h.rooms[client.room] == nil {
				h.rooms[client.room] = make(map[*Client]bool)
			}
			h.rooms[client.room][client] = true
			log.Printf("Client connected to room %s", client.room)

		case client := <-h.unregister:
			if _, ok := h.rooms[client.room][client]; ok {
				delete(h.rooms[client.room], client)
				close(client.send)
			}

		case message := <-h.broadcast:
			if clients, ok := h.rooms[message.Room]; ok {
				data, _ := json.Marshal(message)
				for client := range clients {
					select {
					case client.send <- data:
					default:
						close(client.send)
						delete(clients, client)
					}
				}
			}
		}
	}
}
