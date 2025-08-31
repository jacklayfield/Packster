package ws

type PackingEntry struct {
	ID         string  `json:"id"`
	Name       string  `json:"name"`
	Quantity   int     `json:"quantity"`
	Cost       float64 `json:"cost"`
	AssignedTo string  `json:"assignedTo"`
}

type ClientMessage struct {
	Type   string        `json:"type"`
	RoomID string        `json:"roomId,omitempty"`
	Entry  *PackingEntry `json:"entry,omitempty"`
}

type Envelope struct {
	Type    string        `json:"type"`
	Room    string        `json:"room"`
	Entry   *PackingEntry `json:"entry,omitempty"`
	Payload interface{}   `json:"payload,omitempty"`
}
