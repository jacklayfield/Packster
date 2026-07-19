package ws

import "hash/fnv"

var userColorPalette = []string{
	"#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
	"#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9",
	"#F8B500", "#FF8C69", "#6C5CE7", "#00B894", "#E17055",
}

func colorFromClientID(id string) string {
	if id == "" {
		return userColorPalette[0]
	}

	h := fnv.New32a()
	_, _ = h.Write([]byte(id))
	return userColorPalette[h.Sum32()%uint32(len(userColorPalette))]
}
