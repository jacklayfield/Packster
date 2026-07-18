package ws

import "time"

type PackingEntry struct {
	ID         string  `json:"id"`
	Name       string  `json:"name"`
	Quantity   int     `json:"quantity"`
	Cost       float64 `json:"cost"`
	AssignedTo string  `json:"assignedTo"`
}

type RoomInfo struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// User represents both guest and registered users
type User struct {
	ID        string    `json:"id"`      // UUID for both guests and registered users
	IsGuest   bool      `json:"isGuest"` // true for guest users
	Email     string    `json:"email,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
}

// Membership represents a user's membership in a trip
type Membership struct {
	UserID      string    `json:"userId"`
	DisplayName string    `json:"displayName"` // Trip-specific display name
	JoinedAt    time.Time `json:"joinedAt"`
}

// InviteLink for sharing trips
type InviteLink struct {
	Token     string    `json:"token"`
	TripID    string    `json:"tripId"`
	CreatedAt time.Time `json:"createdAt"`
	ExpiresAt time.Time `json:"expiresAt"`
}

type ClientMessage struct {
	Type        string        `json:"type"`
	UserID      string        `json:"userId,omitempty"`      // UUID of the user (guest or registered)
	DisplayName string        `json:"displayName,omitempty"` // Trip-specific display name
	RoomID      string        `json:"roomId,omitempty"`
	RoomName    string        `json:"roomName,omitempty"`
	Budget      string        `json:"budget,omitempty"`
	Description string        `json:"description,omitempty"`
	Date        string        `json:"date,omitempty"`
	InviteToken string        `json:"inviteToken,omitempty"` // For joining via invite link
	Entry       *PackingEntry `json:"entry,omitempty"`
}

type Envelope struct {
	Type    string        `json:"type"`
	Room    string        `json:"room"`
	UserID  string        `json:"userId,omitempty"`
	User    *User         `json:"user,omitempty"`
	Entry   *PackingEntry `json:"entry,omitempty"`
	Payload interface{}   `json:"payload,omitempty"`
}
