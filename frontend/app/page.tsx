"use client";

import { useRouter } from "next/navigation";
import Home from "@/components/Home";

export default function HomePage() {
  const router = useRouter();

  const handleJoin = (roomId: string, roomName?: string) => {
    if (roomName) {
      // Creating a new room - pass the room name as a query parameter
      router.push(`/room/${roomId}?name=${encodeURIComponent(roomName)}`);
    } else {
      // Joining an existing room
      router.push(`/room/${roomId}`);
    }
  };

  return <Home onJoin={handleJoin} />;
}
