"use client";

import { useState, useEffect } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { ClientMessage, PackingEntry } from "@/types/messages";

type Props = { roomId: string; roomName?: string };

export default function Room({ roomId, roomName: initialRoomName }: Props) {
  const { messages, send } = useWebSocket(roomId, initialRoomName);
  const [entries, setEntries] = useState<PackingEntry[]>([]);
  const [roomName, setRoomName] = useState(initialRoomName || roomId); // Default to initialRoomName or roomId, will be updated from server

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [cost, setCost] = useState(0);
  const [assignedTo, setAssignedTo] = useState("Unassigned");

  useEffect(() => {
    if (messages.length === 0) return;
    const msg = messages[messages.length - 1];

    switch (msg.type) {
      case "room_snapshot":
        setEntries(msg.payload.entries ?? []);
        setRoomName(msg.payload.roomName ?? roomId);
        break;
      case "entry_added":
        setEntries((prev) => [...prev, msg.entry]);
        break;
      case "error":
        console.error(msg.payload);
        break;
      default:
        const _exhaustiveCheck: never = msg;
        return _exhaustiveCheck;
    }
  }, [messages, roomId]);

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
    <div className="max-w-5xl mx-auto p-4 font-sans">
      <h2 className="text-3xl font-bold text-center mb-6">{roomName}</h2>
      <p className="text-sm text-gray-600 text-center mb-6">Room ID: {roomId}</p>

      <ul className="space-y-4">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="flex justify-between bg-white rounded-xl shadow-md p-4"
          >
            <span className="w-1/4 font-semibold">{entry.name}</span>
            <span className="w-1/4 text-center">{entry.quantity} pcs</span>
            <span className="w-1/4 text-center">${entry.cost.toFixed(2)}</span>
            <span className="w-1/4 text-right italic">{entry.assignedTo}</span>
          </li>
        ))}
      </ul>

      <form
        className="flex flex-col mt-6 gap-3"
        onSubmit={(e) => { e.preventDefault(); handleAddEntry(); }}
      >
        <div className="flex gap-3">
          <input
            type="text"
            value={name}
            placeholder="Item name"
            onChange={(e) => setName(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="number"
            value={quantity}
            min={1}
            onChange={(e) => setQuantity(Number(e.target.value))}
            placeholder="Qty"
            className="w-24 px-3 py-2 rounded-xl border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="number"
            value={cost}
            min={0}
            step={0.01}
            onChange={(e) => setCost(Number(e.target.value))}
            placeholder="Cost"
            className="w-24 px-3 py-2 rounded-xl border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="text"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            placeholder="Assigned to"
            className="flex-1 px-3 py-2 rounded-xl border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <button
          type="submit"
          className="self-end px-6 py-2 bg-blue-500 text-white font-semibold rounded-xl shadow hover:bg-blue-600 transition"
        >
          Add
        </button>
      </form>
    </div>
  );
}
