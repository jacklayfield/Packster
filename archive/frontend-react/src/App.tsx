// src/App.tsx
import { useState } from "react";
import Room from "./components/Room";
import Home from "./components/Home";

export default function App() {
  const [roomId, setRoomId] = useState<string | null>(null);

  return roomId ? (
    <Room key={roomId} roomId={roomId} />
  ) : (
    <Home onJoin={(id) => setRoomId(id)} />
  );
}
