"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";
import Room from "@/components/Room";

type ParamsType = Promise<{ roomId: string }>;

export default function RoomPage({ params }: { params: ParamsType }) {
  const { roomId } = use(params);
  const searchParams = useSearchParams();
  const roomName = searchParams.get("room");

  return <Room roomId={roomId} roomName={roomName || undefined} />;
}
