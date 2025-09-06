import { useEffect, useRef, useState, useCallback } from "react";
import type { ClientMessage, ServerMessage } from "@/types/messages";

export function useWebSocket(roomId: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<ServerMessage[]>([]);

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8080/ws/?room=${roomId}`);
    wsRef.current = ws;

    ws.onopen = () => console.log(`WebSocket connected to room ${roomId}`);
    ws.onmessage = (e) => setMessages(prev => [...prev, JSON.parse(e.data)]);
    ws.onerror = (err) => console.error("WebSocket error", err);
    ws.onclose = () => console.log(`WebSocket closed for room ${roomId}`);

    return () => ws.close(); 
  }, [roomId]);

  const send = useCallback((msg: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  return { messages, send };
}
