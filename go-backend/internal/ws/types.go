package ws

type Envelope struct {
	Type string `json:"type"`
	Room string `json:"room"`
	Text string `json:"text,omitempty"`
}
