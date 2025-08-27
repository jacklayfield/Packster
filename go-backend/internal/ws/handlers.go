package ws

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		// Allow all origins for now
		return true
	},
}

func ServeWS(hub *Hub) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Println("Incoming request:", r.Method, r.URL.String())

		room := r.URL.Query().Get("room")
		if room == "" {
			http.Error(w, "room required", http.StatusBadRequest)
			return
		}

		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Printf("WebSocket upgrade failed: %v, headers: %+v\n", err, r.Header)
			return
		}

		client := &Client{
			hub:  hub,
			conn: conn,
			send: make(chan []byte, 256),
			room: room,
		}

		hub.register <- client

		sync := Envelope{
			Type:    "sync",
			Room:    room,
			Payload: []byte(`{"items":[]}`),
		}
		if b, _ := json.Marshal(sync); b != nil {
			client.send <- b
		}

		go client.writePump()
		go client.readPump()
	})
}
