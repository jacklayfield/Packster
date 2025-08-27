import { useEffect, useState, useCallback } from "react";
import type { ClientMessage, ServerMessage } from "../types/messages";
import { getWebSocket } from "./wsClient";

export function useWebSocket(roomId: string) {
  const [messages, setMessages] = useState<ServerMessage[]>([]);

  useEffect(() => {
    const ws = getWebSocket(roomId);

    ws.onopen = () => console.log("WebSocket connected");
    ws.onmessage = (e) => setMessages((prev) => [...prev, JSON.parse(e.data)]);
    ws.onerror = (err) => console.error("WebSocket error", err);
    ws.onclose = () => console.log("WebSocket closed");
  }, [roomId]);

  const send = useCallback((msg: ClientMessage) => {
    const ws = getWebSocket(roomId);
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
  }, [roomId]);

  return { messages, send };
}
