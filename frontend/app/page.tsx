"use client";

import { useRouter } from "next/navigation";
import Home from "@/components/Home";

export default function HomePage() {
  const router = useRouter();

  const handleJoin = (roomId: string, roomName?: string) => {
    if (roomName) {
      // Creating a new room - pass the room name as a query parameter
      console.log(roomName, roomId)
      router.push(`/room/${roomId}?room=${encodeURIComponent(roomName)}`);
    } else {
      // Joining an existing room
      router.push(`/room/${roomId}`);
    }
  };

  return <Home onJoin={handleJoin} />;
}
