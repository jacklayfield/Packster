"use client";

import { useRouter } from "next/navigation";
import Home from "@/components/Home";

export default function HomePage() {
  const router = useRouter();

  const handleJoin = (roomId: string) => {
    router.push(`/room/${roomId}`);
  };

  return <Home onJoin={handleJoin} />;
}
