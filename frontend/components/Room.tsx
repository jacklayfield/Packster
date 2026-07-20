"use client";

import { useState, useEffect } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { getDisplayName, getGuestId, setDisplayName } from "@/lib/guest";
import OnlineUsers from "@/components/OnlineUsers";
import type { ClientMessage, PackingEntry, RoomUser } from "@/types/messages";

type Props = {
  roomId: string;
};

export default function Room({ roomId }: Props) {
  const [clientId, setClientId] = useState("");
  const [displayName, setDisplayNameState] = useState("");
  const [nameDraft, setNameDraft] = useState("");
  const [onlineUsers, setOnlineUsers] = useState<RoomUser[]>([]);
  const [snapshotReceived, setSnapshotReceived] = useState(false);
  const [processedMessageCount, setProcessedMessageCount] = useState(0);

  const { messages, send } = useWebSocket(
    roomId,
    { clientId, displayName }
  );
  const [entries, setEntries] = useState<PackingEntry[]>([]);
  const [roomName, setRoomName] = useState(roomId);
  const [tripBudget, setTripBudget] = useState("0");
  const [tripDescription, setTripDescription] = useState("Add trip details here");
  const [tripDate, setTripDate] = useState(new Date().toLocaleDateString());

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState<number | "">("");
  const [cost, setCost] = useState<number | "">("");
  const [assignedTo, setAssignedTo] = useState("Unassigned");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [shareLink, setShareLink] = useState("");

  // Initialize client-only state after hydration
  useEffect(() => {
    setClientId(getGuestId());
    const savedName = getDisplayName();
    setDisplayNameState(savedName);
    setNameDraft(savedName);
    setAssignedTo(savedName || "Unassigned");
  }, []);

  useEffect(() => {
    setShareLink(`${window.location.origin}/room/${roomId}`);
  }, [roomId]);

  useEffect(() => {
    if (displayName) {
      setAssignedTo((current) => (current === "Unassigned" || current === nameDraft ? displayName : current));
    }
  }, [displayName, nameDraft]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 500);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(roomId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  useEffect(() => {
    console.log("Messages effect running. Messages count:", messages.length, "Processed:", processedMessageCount);
    
    // Process all new messages since last time
    for (let i = processedMessageCount; i < messages.length; i++) {
      const msg = messages[i];
      console.log("Processing message type:", msg.type);

      switch (msg.type) {
        case "room_snapshot":
          console.log("Received room snapshot", msg.payload.entries);
          setSnapshotReceived(true);
          setEntries(msg.payload.entries ?? []);
          setRoomName(msg.payload.roomName || roomId);
          setTripBudget(msg.payload.budget || "0");
          setTripDescription(msg.payload.description || "Add trip details here");
          setTripDate(msg.payload.date || new Date().toLocaleDateString());
          break;
        case "entry_added":
          setEntries((prev) => [...prev, msg.entry]);
          break;
        case "presence_snapshot":
          setOnlineUsers(msg.payload.users ?? []);
          break;
        case "user_joined":
          setOnlineUsers((prev) => {
            const next = prev.filter((user) => user.clientId !== msg.payload.user.clientId);
            return [...next, msg.payload.user];
          });
          break;
        case "user_left":
          setOnlineUsers((prev) => prev.filter((user) => user.clientId !== msg.payload.clientId));
          break;
        case "error":
          console.error(msg.payload);
          break;
      }
    }
    
    // Mark all current messages as processed
    if (messages.length > processedMessageCount) {
      setProcessedMessageCount(messages.length);
    }
  }, [messages, processedMessageCount, roomId]);

  const handleSaveDisplayName = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = nameDraft.trim();
    if (!trimmed) {
      return;
    }

    setDisplayName(trimmed);
    setDisplayNameState(trimmed);
  };

  const handleAddEntry = () => {
    if (!name.trim()) return;

    const entry: PackingEntry = {
      id: crypto.randomUUID(),
      name,
      quantity: quantity === "" ? 1 : quantity,
      cost: cost === "" ? 0 : cost,
      assignedTo,
    };

    const message: ClientMessage = { type: "add_entry", roomId, entry };
    send(message);

    setName("");
    setQuantity(1);
    setCost(0);
    setAssignedTo(displayName || "Unassigned");
  };

  if (!displayName) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <form
          onSubmit={handleSaveDisplayName}
          className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-500">
            Welcome to Packster
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-800">What should we call you?</h1>
          <p className="mt-2 text-sm text-slate-600">
            Pick a display name to join this trip. No account needed.
          </p>
          <input
            type="text"
            value={nameDraft}
            onChange={(event) => setNameDraft(event.target.value)}
            placeholder="Your display name"
            className="mt-6 w-full rounded-2xl border border-slate-200 px-4 py-3 text-base shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
            autoFocus
          />
          <button
            type="submit"
            disabled={!nameDraft.trim()}
            className="mt-4 w-full rounded-2xl bg-blue-500 px-5 py-3 font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            Join trip
          </button>
        </form>
      </div>
    );
  }

  if (!snapshotReceived) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-blue-500"></div>
          <p className="text-lg font-semibold text-slate-700">Loading room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 font-sans">

      <h2 className="text-3xl font-bold text-center mb-6">{roomName}</h2>

      <OnlineUsers users={onlineUsers} />

      {/* Share Link Section */}
      <div className="flex justify-center items-center gap-3 mb-6 text-sm">
        <span className="text-gray-600 font-semibold">Share:</span>
        <code className="bg-blue-100 text-blue-900 px-3 py-1 rounded font-mono font-semibold">
          {shareLink}
        </code>
        <button
          onClick={handleCopyLink}
          className="px-2 py-1 bg-blue-500 text-white text-xs font-semibold rounded hover:bg-blue-600 transition whitespace-nowrap cursor-pointer"
        >
          {copiedLink ? "✓" : "Copy Link"}
        </button>
        <span className="text-gray-400">|</span>
        <button
          onClick={handleCopyId}
          className="px-2 py-1 bg-gray-500 text-white text-xs font-semibold rounded hover:bg-gray-600 transition cursor-pointer"
          title={`Room ID: ${roomId}`}
        >
          {copiedId ? "✓" : "Copy ID"}
        </button>
      </div>

      {/* Info Row */}
      <div className="flex gap-4 mb-6">
        {/* Budget Bubble */}
        <div className="flex-1 bg-green-50 rounded-xl shadow-md p-4 text-center">
          <p className="text-gray-700 text-sm font-semibold mb-1">Budget</p>
          <p className="text-2xl font-bold text-blue-600">
            ${entries.reduce((sum, entry) => sum + entry.cost, 0).toFixed(2)} / ${Number(tripBudget || 0).toFixed(2)}
          </p>
        </div>

        {/* Description Bubble */}
        <div className="flex-2 bg-blue-50 rounded-xl shadow-md p-4 text-center">
          <p className="text-gray-700 text-sm font-semibold mb-1">Description</p>
          <p className="text-sm text-gray-600 italic">{tripDescription}</p>
        </div>

        {/* Date Bubble */}
        <div className="flex-1 bg-purple-50 rounded-xl shadow-md p-4 text-center">
          <p className="text-gray-700 text-sm font-semibold mb-1">Date</p>
          <p className="text-lg font-semibold text-purple-600">
            {tripDate}
          </p>
        </div>
      </div>

      {/* Header Row */}
      <div className="flex justify-between text-gray-700 font-semibold mb-2 px-4">
        <span className="w-1/4">Item Name</span>
        <span className="w-1/4 text-center">Quantity</span>
        <span className="w-1/4 text-center">Cost</span>
        <span className="w-1/4 text-right">Assigned To</span>
      </div>

      <div className="max-h-[60vh] overflow-y-auto">
        {entries.length === 0 ? (
          <div className="text-center text-gray-500 italic py-8">
            No items created yet
          </div>
        ) : (
          <ul className="space-y-4">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="flex justify-between bg-white rounded-xl shadow-md p-4"
              >
                <span className="w-1/4 font-semibold">{entry.name}</span>
                <span className="w-1/4 text-center">{entry.quantity} pcs</span>
                <span className="w-1/4 text-center">
                  ${entry.cost.toFixed(2)}
                </span>
                <span className="w-1/4 text-right italic">
                  {entry.assignedTo}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form
        className="flex flex-col mt-6 gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          handleAddEntry();
        }}
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
            placeholder="Qty"
            onChange={(e) =>
              setQuantity(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="w-48 px-3 py-2 rounded-xl border border-gray-300 shadow-sm"
          />

          <input
            type="number"
            value={cost}
            min={0}
            step={0.01}
            placeholder="Cost"
            onChange={(e) =>
              setCost(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="w-48 px-3 py-2 rounded-xl border border-gray-300 shadow-sm"
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
          className="self-end px-6 py-2 bg-blue-500 text-white font-semibold rounded-xl shadow hover:bg-blue-600 transition cursor-pointer"
        >
          Add
        </button>
      </form>
    </div>
  );
}
