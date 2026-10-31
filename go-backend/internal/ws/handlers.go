package ws

import (
	"log"
	"net/http"
	"os"

	"go-backend/internal/auth"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		expectedOrigin := os.Getenv("FRONTEND_ORIGIN")
		if expectedOrigin == "" {
			expectedOrigin = "http://localhost:3000"
		}
		return r.Header.Get("Origin") == expectedOrigin
	},
}

func ServeWS(hub *Hub, authenticator *auth.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		roomID := r.URL.Query().Get("room")
		if roomID == "" {
			http.Error(w, "room required", http.StatusBadRequest)
			return
		}
		user, authenticated, err := authenticator.AuthenticateRequest(r)
		if err != nil {
			log.Printf("authenticate websocket session: %v", err)
			http.Error(w, "unable to authenticate session", http.StatusInternalServerError)
			return
		}

		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Println("upgrade error:", err)
			http.Error(w, "failed to upgrade to websocket", http.StatusInternalServerError)
			return
		}

		client := &Client{
			hub:           hub,
			conn:          conn,
			send:          make(chan []byte, 256),
			room:          roomID,
			authenticated: authenticated,
			authenticator: authenticator,
		}
		if authenticated {
			client.accountID = user.ID
			client.accountName = user.DisplayName
			if cookie, err := r.Cookie(auth.SessionCookieName); err == nil {
				client.sessionToken = cookie.Value
			}
		}

		hub.register <- client

		go client.writePump()
		go client.readPump()
	})
}
