import { useState, useEffect } from "react";
import { useWebSocket } from "../hooks/useWebSocket";
import type { ClientMessage } from "../types/messages";
import EntryForm from "./EntryForm";
import "../styling/Room.css";

type Props = { roomId: string };

export default function Room({ roomId }: Props) {
  const { messages, send } = useWebSocket(roomId);
  const [entries, setEntries] = useState<string[]>([]);

  useEffect(() => {
    if (messages.length === 0) return;
    const msg = messages[messages.length - 1];

    switch (msg.type) {
      case "joined":
        console.log(`Joined room ${msg.roomId}`);
        break;
      case "entry_added":
        setEntries(prev => [...prev, msg.text]);
        break;
      case "sync":
        setEntries(msg.payload.items ?? []);
        break;
      case "error":
        console.error(msg.message);
        break;
      default:
        const _exhaustiveCheck: never = msg;
        return _exhaustiveCheck;
    }
  }, [messages]);

  const handleAddEntry = (text: string) => {
    const message: ClientMessage = { type: "add_entry", roomId, text };
    send(message);
  };

  return (
    <div className="room-container">
      <h2 className="room-header">Room: {roomId}</h2>

      <ul className="entries-list">
        {entries.map((entry, i) => (
          <li key={i} className="entry-card">{entry}</li>
        ))}
      </ul>

      <div className="entry-form">
        <EntryForm onAdd={handleAddEntry} />
      </div>
    </div>
  );
}
