"use client";

import { useRouter } from "next/navigation";
import Home from "@/components/Home";

export default function HomePage() {
  const router = useRouter();

  const handleJoin = (roomId: string) => {
    if (!roomId) {
      router.push(`/create`);
    } else {
      router.push(`/room/${roomId}`);
    }
  };

  return <Home onJoin={handleJoin} />;
}
