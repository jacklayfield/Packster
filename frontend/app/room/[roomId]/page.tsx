"use client";

import { Suspense, use } from "react";
import { useSearchParams } from "next/navigation";
import Room from "@/components/Room";

type ParamsType = Promise<{ roomId: string }>;

function RoomPageContent({ roomId }: { roomId: string }) {
  const searchParams = useSearchParams();
  const roomName = searchParams.get("room");
  const budget = searchParams.get("budget") || undefined;
  const description = searchParams.get("description") || undefined;
  const date = searchParams.get("date") || undefined;

  return <Room roomId={roomId} roomName={roomName || undefined} budget={budget} description={description} date={date} />;
}

export default function RoomPage({ params }: { params: ParamsType }) {
  const { roomId } = use(params);

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50">Loading room...</div>}>
      <RoomPageContent roomId={roomId} />
    </Suspense>
  );
}
