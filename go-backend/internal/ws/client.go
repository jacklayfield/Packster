package ws

import (
	"encoding/json"
	"log"
	"time"

	"github.com/gorilla/websocket"
)

type Client struct {
	hub         *Hub
	conn        *websocket.Conn
	send        chan []byte
	room        string
	userID      string // UUID of the user
	displayName string // Trip-specific display name
	user        *User  // User information
}

const (
	writeWait  = 10 * time.Second
	pongWait   = 60 * time.Second
	pingPeriod = (pongWait * 9) / 10
)

func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadLimit(512)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("read error: %v", err)
			}
			break
		}

		var msg ClientMessage
		if err := json.Unmarshal(message, &msg); err != nil {
			log.Printf("invalid client message: %v", err)
			continue
		}

		switch msg.Type {
		case "join":
			if msg.RoomID != "" && msg.UserID != "" {
				c.userID = msg.UserID
				c.displayName = msg.DisplayName
				c.room = msg.RoomID

				// Create or retrieve user
				if _, ok := c.hub.users[msg.UserID]; !ok {
					c.hub.users[msg.UserID] = &User{
						ID:      msg.UserID,
						IsGuest: true,
					}
				}

				room := c.hub.joinRoom(msg.RoomID, msg.UserID, msg.DisplayName, c)
				if room == nil {
					log.Printf("Failed to join room %s - room not found", msg.RoomID)
					// Send error message to client
					errorMsg := Envelope{
						Type:    "error",
						Room:    msg.RoomID,
						Payload: "Room not found",
					}
					data, _ := json.Marshal(errorMsg)
					select {
					case c.send <- data:
					default:
						close(c.send)
					}
				} else {
					log.Printf("User %s (%s) joined room %s", msg.UserID, msg.DisplayName, msg.RoomID)
				}
			}

		case "create_room":
			if msg.RoomID != "" && msg.RoomName != "" && msg.UserID != "" {
				c.userID = msg.UserID
				c.displayName = msg.DisplayName
				c.room = msg.RoomID

				// Create or retrieve user
				if _, ok := c.hub.users[msg.UserID]; !ok {
					c.hub.users[msg.UserID] = &User{
						ID:      msg.UserID,
						IsGuest: true,
					}
				}

				c.hub.createRoom(msg.RoomID, msg.RoomName, msg.Budget, msg.Description, msg.Date, msg.UserID, msg.DisplayName, c)
				log.Printf("User %s created room %s with name %s", msg.UserID, msg.RoomID, msg.RoomName)
			}

		case "add_entry":
			if msg.Entry != nil {
				c.hub.broadcast <- Envelope{
					Type:  "entry_added",
					Room:  c.room,
					Entry: msg.Entry,
				}
			}

		default:
			log.Printf("Unknown message type: %s", msg.Type)
		}
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()
	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.conn.WriteMessage(websocket.TextMessage, message); err != nil {
				log.Println("write error:", err)
				return
			}
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
