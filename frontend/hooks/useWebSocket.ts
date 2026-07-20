import { useEffect, useRef, useState, useCallback } from "react";
import type { ClientMessage, ServerMessage } from "@/types/messages";

type Identity = {
  clientId: string;
  displayName: string;
};

export function useWebSocket(
  roomId: string,
  identity: Identity
) {
  const wsRef = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<ServerMessage[]>([]);
  const messageQueueRef = useRef<ClientMessage[]>([]);
  const sentInitialMessageRef = useRef(false);

  // Establish WebSocket connection - only depends on roomId and clientId
  useEffect(() => {
    if (!roomId || !identity.clientId) {
      return;
    }

    sentInitialMessageRef.current = false; // Reset when reconnecting

    const ws = new WebSocket(`ws://localhost:8080/ws/?room=${roomId}`);
    wsRef.current = ws;

    const flushQueue = () => {
      while (messageQueueRef.current.length > 0) {
        const msg = messageQueueRef.current.shift();
        if (msg) {
          console.log("Flushing queued message:", msg.type);
          ws.send(JSON.stringify(msg));
        }
      }
    };

    ws.onopen = () => {
      console.log("WebSocket OPEN");
      flushQueue();
    };

    ws.onmessage = (event) => {
      console.log("Frontend received message from backend:", event.data);
      setMessages((previous) => [...previous, JSON.parse(event.data)]);
    };
    ws.onerror = (error) => console.error("WebSocket error", error);
    ws.onclose = () => console.log(`WebSocket closed for room ${roomId}`);

    return () => ws.close();
  }, [roomId, identity.clientId]);

  // Send create or join message once displayName is available
  useEffect(() => {
    if (!identity.displayName || !identity.clientId || !roomId || sentInitialMessageRef.current) {
      return;
    }

    let creationData: any = null;
    let messageRoomName = "";

    // Try to read creation data from sessionStorage (set by create page)
    if (typeof window !== "undefined") {
      try {
        const sessionValue = window.sessionStorage.getItem(`packster-create:${roomId}`);
        if (sessionValue) {
          creationData = JSON.parse(sessionValue);
          messageRoomName = creationData.roomName;
          // Clean up sessionStorage
          window.sessionStorage.removeItem(`packster-create:${roomId}`);
        }
      } catch (e) {
        // Ignore errors
      }
    }

    let message: ClientMessage;

    // If we have creation data from sessionStorage, it's a new room creation
    if (creationData && messageRoomName) {
      console.log("Sending create_room message", messageRoomName);
      // Creating a new room
      message = {
        type: "create_room",
        roomId,
        roomName: messageRoomName,
        clientId: identity.clientId,
        displayName: identity.displayName,
        budget: creationData.budget,
        description: creationData.description,
        date: creationData.date,
      };
    } else {
      console.log("Sending join message");
      // Joining existing room (including on refresh when sessionStorage is empty)
      message = {
        type: "join",
        roomId,
        clientId: identity.clientId,
        displayName: identity.displayName,
      };
    }

    sentInitialMessageRef.current = true;

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log("WebSocket OPEN, sending message immediately");
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.log("WebSocket not ready (state: " + (wsRef.current?.readyState ?? 'null') + "), queueing message");
      messageQueueRef.current.push(message);
      
      // Also try sending after a small delay if WebSocket is still connecting
      if (wsRef.current?.readyState === WebSocket.CONNECTING) {
        setTimeout(() => {
          if (messageQueueRef.current.length > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
            console.log("WebSocket now ready, flushing queue");
            while (messageQueueRef.current.length > 0) {
              const msg = messageQueueRef.current.shift();
              if (msg) {
                wsRef.current!.send(JSON.stringify(msg));
              }
            }
          }
        }, 100);
      }
    }
  }, [identity.displayName, identity.clientId, roomId]);

  const send = useCallback((message: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      messageQueueRef.current.push(message);
    }
  }, []);

  return { messages, send, connected: Boolean(identity.clientId) };
}
