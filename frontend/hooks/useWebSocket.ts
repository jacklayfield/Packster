import { useEffect, useRef, useState, useCallback } from "react";
import type { ClientMessage, ServerMessage } from "@/types/messages";

type RoomDetails = {
  budget?: string;
  description?: string;
  date?: string;
};

type Identity = {
  clientId: string;
  displayName: string;
};

export function useWebSocket(
  roomId: string,
  identity: Identity,
  roomName?: string,
  roomDetails?: RoomDetails
) {
  const wsRef = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<ServerMessage[]>([]);
  const canConnect = Boolean(roomId && identity.clientId && identity.displayName);

  useEffect(() => {
    if (!canConnect) {
      return;
    }

    const ws = new WebSocket(`ws://localhost:8080/ws/?room=${roomId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      if (roomName) {
        const createMessage: ClientMessage = {
          type: "create_room",
          roomId,
          roomName,
          clientId: identity.clientId,
          displayName: identity.displayName,
          budget: roomDetails?.budget,
          description: roomDetails?.description,
          date: roomDetails?.date,
        };
        ws.send(JSON.stringify(createMessage));
      } else {
        const joinMessage: ClientMessage = {
          type: "join",
          roomId,
          clientId: identity.clientId,
          displayName: identity.displayName,
        };
        ws.send(JSON.stringify(joinMessage));
      }
    };

    ws.onmessage = (event) => {
      setMessages((previous) => [...previous, JSON.parse(event.data)]);
    };
    ws.onerror = (error) => console.error("WebSocket error", error);
    ws.onclose = () => console.log(`WebSocket closed for room ${roomId}`);

    return () => ws.close();
  }, [
    canConnect,
    roomId,
    roomName,
    identity.clientId,
    identity.displayName,
    roomDetails?.budget,
    roomDetails?.description,
    roomDetails?.date,
  ]);

  const send = useCallback((message: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  return { messages, send, connected: canConnect };
}
