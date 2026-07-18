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
  const [storedRoomData, setStoredRoomData] = useState<StoredRoomData>({});

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const storedValue = window.localStorage.getItem(`packster-room:${roomId}`);
      if (storedValue) {
        setStoredRoomData(JSON.parse(storedValue));
      }
    } catch {
      setStoredRoomData({});
    }
  }, [roomId]);

  return (
    <Room
      roomId={roomId}
      roomName={storedRoomData.roomName}
      budget={storedRoomData.budget}
      description={storedRoomData.description}
      date={storedRoomData.date}
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
