import { useState, useEffect } from "react";
import { useWebSocket } from "../hooks/useWebSocket";
import type { ClientMessage, ServerMessage } from "../types/messages";
import EntryForm from "./EntryForm";

type Props = { roomId: string };

export default function Room({ roomId }: Props) {
  const { messages, send } = useWebSocket(roomId);
  const [entries, setEntries] = useState<string[]>([]);

useEffect(() => {
  messages.forEach((msg: ServerMessage) => {
    switch (msg.type) {
      case "joined":
        console.log(`Joined room ${msg.roomId}`);
        break;
      case "entry_added":
        setEntries((prev) => [...prev, msg.text]);
        break;
      case "sync":
        const data = msg.payload.items ?? [];
        setEntries(data);
        break;
      case "error":
        console.error(msg.message);
        break;
      default:
        const _exhaustiveCheck: never = msg;
        return _exhaustiveCheck;
    }
  });
}, [messages]);

  const handleAddEntry = (text: string) => {
    const message: ClientMessage = { type: "add_entry", roomId, text };
    send(message);
  };

  return (
    <div>
      <h2>Room: {roomId}</h2>
      <ul>
        {entries.map((entry, i) => (
          <li key={i}>{entry}</li>
        ))}
      </ul>
      <EntryForm onAdd={handleAddEntry} />
    </div>
  );
}
