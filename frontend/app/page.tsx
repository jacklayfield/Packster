"use client";

import { useRouter } from "next/navigation";
import Home from "@/components/Home";

export default function HomePage() {
  const router = useRouter();

  const handleJoin = (roomId: string, roomName?: string) => {
    if (roomName) {
      router.push(`/create?room=${encodeURIComponent(roomName)}`);
    } else {
      router.push(`/room/${roomId}`);
    }
  };

  return <Home onJoin={handleJoin} />;
}
