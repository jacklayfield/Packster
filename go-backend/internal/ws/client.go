package ws

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"log"
	"strings"
	"time"

	"github.com/gorilla/websocket"
)

type Client struct {
	hub         *Hub
	conn        *websocket.Conn
	send        chan []byte
	room        string
	id          string
	displayName string
	color       string
}

func (c *Client) applyIdentity(clientID, displayName string) {
	if clientID != "" {
		c.id = clientID
	} else if c.id == "" {
		c.id = newClientID()
	}

	displayName = strings.TrimSpace(displayName)
	if displayName != "" {
		c.displayName = displayName
	}

	c.color = colorFromClientID(c.id)
}

func (c *Client) roomUser() RoomUser {
	return RoomUser{
		ClientID:    c.id,
		DisplayName: c.displayName,
		Color:       c.color,
	}
}

func newClientID() string {
	buf := make([]byte, 16)
	if _, err := rand.Read(buf); err != nil {
		return hex.EncodeToString([]byte(time.Now().String()))
	}
	return hex.EncodeToString(buf)
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
			if msg.RoomID != "" {
				c.applyIdentity(msg.ClientID, msg.DisplayName)
				c.room = msg.RoomID
				room := c.hub.joinRoom(msg.RoomID, c)
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
					log.Printf("Client joined room %s", msg.RoomID)
				}
			}

		case "create_room":
			if msg.RoomID != "" && msg.RoomName != "" {
				c.applyIdentity(msg.ClientID, msg.DisplayName)
				c.room = msg.RoomID
				c.hub.createRoom(msg.RoomID, msg.RoomName, msg.Budget, msg.Description, msg.Date, c)
				log.Printf("Client created room %s with name %s", msg.RoomID, msg.RoomName)
			}

		case "add_entry":
			if msg.Entry != nil {
				c.hub.broadcast <- Envelope{
					Type:  "entry_added",
					Room:  c.room,
					Entry: msg.Entry,
				}
			}

		case "delete_entry":
			// Allow either Entry with ID set, or EntryID field
			var id string
			if msg.Entry != nil && msg.Entry.ID != "" {
				id = msg.Entry.ID
			} else if msg.EntryID != "" {
				id = msg.EntryID
			}
			if id != "" {
				c.hub.broadcast <- Envelope{
					Type:  "entry_deleted",
					Room:  c.room,
					Entry: &PackingEntry{ID: id},
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
			log.Printf("writePump: sending message to client %s", c.id)
			if err := c.conn.WriteMessage(websocket.TextMessage, message); err != nil {
				log.Printf("write error for client %s: %v", c.id, err)
				return
			}
			log.Printf("writePump: message sent successfully")
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
