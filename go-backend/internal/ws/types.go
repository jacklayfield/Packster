package ws

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

type RoomUser struct {
	ClientID    string `json:"clientId"`
	DisplayName string `json:"displayName"`
	Color       string `json:"color"`
}

type ClientMessage struct {
	Type        string        `json:"type"`
	RoomID      string        `json:"roomId,omitempty"`
	RoomName    string        `json:"roomName,omitempty"`
	Budget      string        `json:"budget,omitempty"`
	Description string        `json:"description,omitempty"`
	Date        string        `json:"date,omitempty"`
	ClientID    string        `json:"clientId,omitempty"`
	DisplayName string        `json:"displayName,omitempty"`
	Entry       *PackingEntry `json:"entry,omitempty"`
	EntryID     string        `json:"entryId,omitempty"`
}

type Envelope struct {
	Type    string        `json:"type"`
	Room    string        `json:"room"`
	Entry   *PackingEntry `json:"entry,omitempty"`
	Payload interface{}   `json:"payload,omitempty"`
}
