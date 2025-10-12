package ws

import (
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

func ServeWS(hub *Hub) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		roomID := r.URL.Query().Get("room")
		if roomID == "" {
			http.Error(w, "room required", http.StatusBadRequest)
			return
		}

		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Println("upgrade error:", err)
			http.Error(w, "failed to upgrade to websocket", http.StatusInternalServerError)
			return
		}

		client := &Client{
			hub:  hub,
			conn: conn,
			send: make(chan []byte, 256),
			room: roomID,
		}

		hub.register <- client

		go client.writePump()
		go client.readPump()
	})
}
