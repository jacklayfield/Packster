import { useState, useEffect } from "react";
import { useWebSocket } from "../hooks/useWebSocket";
import type { ClientMessage, PackingEntry } from "../types/messages";
import "../styling/Room.css";

type Props = { roomId: string };

export default function Room({ roomId }: Props) {
  const { messages, send } = useWebSocket(roomId);
  const [entries, setEntries] = useState<PackingEntry[]>([]);

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [cost, setCost] = useState(0);
  const [assignedTo, setAssignedTo] = useState("Unassigned");

  useEffect(() => {
    if (messages.length === 0) return;
    const msg = messages[messages.length - 1];

    switch (msg.type) {
      case "room_snapshot":
        setEntries(msg.payload ?? []);
        break;
      case "entry_added":
        setEntries((prev) => [...prev, msg.entry]);
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
      <h2 className="room-header">{roomId}</h2>
      <ul className="entries-list">
        {entries.map((entry) => (
         <li key={entry.id} className="entry-card">
          <span className="entry-section"><strong>{entry.name}</strong></span>
          <span className="entry-section">{entry.quantity} pcs</span>
          <span className="entry-section">${entry.cost.toFixed(2)}</span>
          <span className="entry-section"><em>{entry.assignedTo}</em></span>
        </li>
        ))}
      </ul>

      <form
        className="entry-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleAddEntry();
        }}
      >
        <div className="inputs-container">
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
        </div>
        <div className="button-container">
          <button type="submit" className="entry-button">
            Add
          </button>
        </div>
      </form>
    </div>
  );
}
