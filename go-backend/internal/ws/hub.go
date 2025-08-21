package ws

import "sync"

type Hub struct {
	rooms map[string]map[*Client]bool
	mu    sync.RWMutex

	register   chan *Client
	unregister chan *Client
	broadcast  chan Broadcast
}

type Broadcast struct {
	room string
	msg  []byte
}

func NewHub() *Hub {
	return &Hub{
		rooms:      make(map[string]map[*Client]bool),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan Broadcast, 1024),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case c := <-h.register:
			h.mu.Lock()
			if h.rooms[c.room] == nil {
				h.rooms[c.room] = make(map[*Client]bool)
			}
			h.rooms[c.room][c] = true
			h.mu.Unlock()

		case c := <-h.unregister:
			h.mu.Lock()
			if peers, ok := h.rooms[c.room]; ok {
				if _, present := peers[c]; present {
					delete(peers, c)
					close(c.send)
					if len(peers) == 0 {
						delete(h.rooms, c.room)
					}
				}
			}
			h.mu.Unlock()

		case b := <-h.broadcast:
			h.mu.RLock()
			for c := range h.rooms[b.room] {
				select {
				case c.send <- b.msg:
				default:
					go c.Close()
				}
			}
			h.mu.RUnlock()
		}
	}
}
