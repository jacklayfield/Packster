import { useEffect, useRef, useState, useCallback } from "react";
import type { ClientMessage, ServerMessage } from "@/types/messages";

export function useWebSocket(
  roomId: string,
  roomName?: string,
  roomDetails?: { budget?: string; description?: string; date?: string }
) {
  const wsRef = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<ServerMessage[]>([]);

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8080/ws/?room=${roomId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log(`WebSocket connected to room ${roomId}`);
      // Send join or create room message
      if (roomName) {
        // This is a new room creation
        const createMessage: ClientMessage = {
          type: "create_room",
          roomId,
          roomName,
          budget: roomDetails?.budget,
          description: roomDetails?.description,
          date: roomDetails?.date,
        };
        ws.send(JSON.stringify(createMessage));
      } else {
        // This is joining an existing room
        const joinMessage: ClientMessage = {
          type: "join",
          roomId
        };
        ws.send(JSON.stringify(joinMessage));
      }
    };
    
    ws.onmessage = (e) => setMessages(prev => [...prev, JSON.parse(e.data)]);
    ws.onerror = (err) => console.error("WebSocket error", err);
    ws.onclose = () => console.log(`WebSocket closed for room ${roomId}`);

    return () => ws.close(); 
  }, [roomId, roomName, roomDetails?.budget, roomDetails?.description, roomDetails?.date]);

  const send = useCallback((msg: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  return { messages, send };
}
