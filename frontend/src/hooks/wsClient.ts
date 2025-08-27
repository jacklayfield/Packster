let ws: WebSocket | null = null;

export function getWebSocket(roomId: string): WebSocket {
  if (!ws || ws.readyState === WebSocket.CLOSED) {
    ws = new WebSocket(`ws://localhost:8080/ws/?room=${roomId}`);
  }
  return ws;
}
