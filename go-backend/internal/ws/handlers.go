package ws

import (
	"encoding/json"
	"net/http"
)

func ServeWS(hub *Hub) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		room := r.URL.Query().Get("room")
		if room == "" {
			http.Error(w, "room required", http.StatusBadRequest)
			return
		}

		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			return
		}

		client := &Client{hub: hub, conn: conn, send: make(chan []byte, 256), room: room}
		hub.register <- client

		// On connect, send sync (empty for now)
		sync := Envelope{Type: "sync", Room: room, Payload: []byte(`{"items":[]}`)}
		if b, _ := json.Marshal(sync); b != nil {
			client.send <- b
		}

		go client.writePump()
		go client.readPump()
	})
}
