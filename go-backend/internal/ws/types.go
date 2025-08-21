package ws

import "encoding/json"

type Envelope struct {
	Type    string          `json:"type"`
	Room    string          `json:"room"`
	Payload json.RawMessage `json:"payload"`
}

type AddItemPayload struct {
	ID      string `json:"id"`
	Text    string `json:"text"`
	AddedBy string `json:"addedBy"`
}

type RemoveItemPayload struct {
	ID string `json:"id"`
}

type SyncPayload struct {
	Items []AddItemPayload `json:"items"`
}
