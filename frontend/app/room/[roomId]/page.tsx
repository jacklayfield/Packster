"use client";

import { Suspense, use, useEffect, useState } from "react";
import Room from "@/components/Room";

type ParamsType = Promise<{ roomId: string }>;

type StoredRoomData = {
  roomName?: string;
  budget?: string;
  description?: string;
  date?: string;
};

function RoomPageContent({ roomId }: { roomId: string }) {
  return (
    <Room
      roomId={roomId}
    />
  );
}

export default function RoomPage({ params }: { params: ParamsType }) {
  const { roomId } = use(params);

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50">Loading room...</div>}>
      <RoomPageContent roomId={roomId} />
    </Suspense>
  );
}
