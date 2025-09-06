"use client";

import { use } from "react";
import Room from "@/components/Room";

type ParamsType = Promise<{ roomId: string }>;

export default function RoomPage({ params }: { params: ParamsType }) {
  const { roomId } = use(params);

  return <Room roomId={roomId} />;
}
