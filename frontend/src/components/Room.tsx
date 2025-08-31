import { useState, useEffect } from "react";
import { useWebSocket } from "../hooks/useWebSocket";
import type { ClientMessage, PackingEntry } from "../types/messages";
import "../styling/Room.css";

type Props = { roomId: string };

export default function Room({ roomId }: Props) {
  const { messages, send } = useWebSocket(roomId);
  const [entries, setEntries] = useState<PackingEntry[]>([]);

  // Local state for form inputs
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [cost, setCost] = useState(0);
  const [assignedTo, setAssignedTo] = useState("Unassigned");

  useEffect(() => {
    if (messages.length === 0) return;
    const msg = messages[messages.length - 1];

    switch (msg.type) {
      case "joined":
        console.log(`Joined room ${msg.roomId}`);
        break;
      case "entry_added":
        setEntries((prev) => [...prev, msg.entry]);
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

  const handleAddEntry = () => {
    if (!name.trim()) return;

    const entry: PackingEntry = {
      id: crypto.randomUUID(),
      name,
      quantity,
      cost,
      assignedTo,
    };

    const message: ClientMessage = { type: "add_entry", roomId, entry };
    send(message);

    setName("");
    setQuantity(1);
    setCost(0);
    setAssignedTo("Unassigned");
  };

  return (
    <div className="room-container">
      <h2 className="room-header">Room: {roomId}</h2>

      <ul className="entries-list">
        {entries.map((entry) => (
          <li key={entry.id} className="entry-card">
            <strong>{entry.name}</strong> — {entry.quantity} pcs — ${entry.cost} —{" "}
            <em>{entry.assignedTo}</em>
          </li>
        ))}
      </ul>

      <div className="entry-form">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAddEntry();
          }}
        >
          <input
            type="text"
            value={name}
            placeholder="Item name"
            onChange={(e) => setName(e.target.value)}
            className="entry-input"
          />
          <input
            type="number"
            value={quantity}
            min={1}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="entry-input"
            placeholder="Qty"
          />
          <input
            type="number"
            value={cost}
            min={0}
            step={0.01}
            onChange={(e) => setCost(Number(e.target.value))}
            className="entry-input"
            placeholder="Cost"
          />
          <input
            type="text"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="entry-input"
            placeholder="Assigned to"
          />
          <button type="submit" className="entry-button">
            Add
          </button>
        </form>
      </div>
    </div>
  );
}
