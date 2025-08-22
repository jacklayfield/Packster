import { useState } from "react";
import { useWebSocket } from "../hooks/useWebSocket";
import type { ClientMessage, ServerMessage } from "../types/messages";
import EntryForm from "./EntryForm";

type Props = { roomId: string };

export default function Room({ roomId }: Props) {
  const { messages, send } = useWebSocket("ws://localhost:8080/ws");
  const [entries, setEntries] = useState<string[]>([]);

  // incoming messages
  messages.forEach((msg: ServerMessage) => {
    if (msg.type === "joined") {
      console.log(`Joined room ${msg.roomId}`);
    }
    if (msg.type === "entry_added") {
      setEntries((prev) => [...prev, msg.text]);
    }
  });

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
