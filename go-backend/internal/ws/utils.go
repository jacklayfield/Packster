package ws

import (
	"crypto/rand"
	"encoding/hex"
)

// generateToken creates a random short token for invite links
func generateToken() string {
	b := make([]byte, 8)
	rand.Read(b)
	return hex.EncodeToString(b)
}
