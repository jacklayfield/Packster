"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccount, accountApiURL } from "@/lib/auth";

type OwnedRoom = {
  id: string;
  name: string;
  description: string;
  date: string;
  createdAt: string;
};

export default function MyRoomsPage() {
  const router = useRouter();
  const { account, isLoading: isAccountLoading } = useAccount();
  const [rooms, setRooms] = useState<OwnedRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [roomToDelete, setRoomToDelete] = useState<OwnedRoom | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isAccountLoading) return;
    if (!account) {
      router.replace(`/account?returnTo=${encodeURIComponent("/rooms")}`);
      setIsLoading(false);
      return;
    }

    let active = true;
    fetch(`${accountApiURL}/api/auth/rooms`, { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load your rooms. Please try again.");
        const data = (await response.json()) as OwnedRoom[];
        if (active) setRooms(data);
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : "Unable to connect to Packster.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [account, isAccountLoading, router]);

  const deleteRoom = async () => {
    if (!roomToDelete) return;
    setError("");
    setIsDeleting(true);
    try {
      const response = await fetch(`${accountApiURL}/api/auth/rooms/${encodeURIComponent(roomToDelete.id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Unable to delete this room. Please try again.");
      setRooms((current) => current.filter((room) => room.id !== roomToDelete.id));
      setRoomToDelete(null);
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : "Unable to connect to Packster.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isAccountLoading || isLoading) {
    return <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-300 to-purple-200 px-4 font-sans"><p className="rounded-2xl bg-white/90 px-6 py-4 font-semibold text-slate-700">Loading your rooms...</p></main>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-300 to-purple-200 px-4 py-12 font-sans">
      <section className="mx-auto w-full max-w-3xl rounded-3xl bg-white/95 p-8 shadow-2xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-500">Your trips</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-800">My rooms</h1>
          </div>
          <Link href="/create" className="rounded-xl bg-pink-500 px-5 py-3 font-semibold text-white transition hover:bg-pink-600">
            Create new room
          </Link>
        </header>

        {error && <p role="alert" className="mt-6 rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p>}

        {rooms.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 px-5 py-10 text-center">
            <p className="font-semibold text-slate-800">You haven&apos;t created any rooms yet.</p>
            <p className="mt-2 text-sm text-slate-600">Create a room to start planning your next trip.</p>
          </div>
        ) : (
          <ul className="mt-8 space-y-3">
            {rooms.map((room) => (
              <li key={room.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 shadow-sm">
                <Link href={`/room/${encodeURIComponent(room.id)}`} className="min-w-0 flex-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <span className="block truncate font-semibold text-slate-800">{room.name || "Untitled room"}</span>
                  {room.description && <span className="mt-1 block truncate text-sm text-slate-600">{room.description}</span>}
                  <span className="mt-2 block text-xs text-slate-500">{room.date ? `Trip date: ${room.date}` : `Room ID: ${room.id}`}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setRoomToDelete(room)}
                  aria-label={`Delete ${room.name || "untitled room"}`}
                  className="shrink-0 rounded-xl px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}

        <Link href="/" className="mt-8 inline-block text-sm font-semibold text-blue-600 hover:underline">Back to Packster</Link>
      </section>

      {roomToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="delete-room-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 id="delete-room-title" className="text-xl font-bold text-slate-800">Delete this room?</h2>
            <p className="mt-2 text-sm text-slate-600">
              &ldquo;{roomToDelete.name || "Untitled room"}&rdquo; and its packing list will be permanently deleted.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" disabled={isDeleting} onClick={() => setRoomToDelete(null)} className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-700">
                Cancel
              </button>
              <button type="button" disabled={isDeleting} onClick={deleteRoom} className="rounded-xl bg-rose-600 px-4 py-2 font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60">
                {isDeleting ? "Deleting..." : "Delete room"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
