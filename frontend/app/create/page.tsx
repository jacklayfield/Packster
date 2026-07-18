"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

function CreateRoomForm() {
    const router = useRouter();
    const [tripName, setTripName] = useState("");
    const [budget, setBudget] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
    const [error, setError] = useState("");

    useEffect(() => {
        if (typeof window !== "undefined") {
            const tempRoomName = sessionStorage.getItem("packster_temp_room_name");
            if (tempRoomName) {
                setTripName(tempRoomName);
                sessionStorage.removeItem("packster_temp_room_name");
            } else {
                setTripName("My Trip");
            }
        }
    }, []);

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        if (!budget.trim()) {
            setError("Please enter a budget for this trip.");
            return;
        }

        if (!description.trim()) {
            setError("Please add a short trip description.");
            return;
        }

        const roomId = crypto.randomUUID().replace(/-/g, "");

        if (typeof window !== "undefined") {
            window.localStorage.setItem(
                `packster-room:${roomId}`,
                JSON.stringify({
                    roomName: tripName,
                    budget: budget.trim(),
                    description: description.trim(),
                    date,
                })
            );
        }

        router.push(`/room/${roomId}`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-300 to-purple-200 flex items-center justify-center px-4 py-12 font-sans">
            <div className="w-full max-w-xl rounded-3xl bg-white/90 p-8 shadow-2xl backdrop-blur">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-500">
                    Create your trip room
                </p>
                <h1 className="mt-2 text-3xl font-bold text-slate-800">
                    Finish setting up {tripName}
                </h1>
                <p className="mt-3 text-sm text-slate-600">
                    Add the trip details below so your packing room is ready to use.
                </p>

                <form className="mt-8 flex flex-col gap-4" onSubmit={handleSubmit}>
                    <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        Budget
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={budget}
                            onChange={(event) => {
                                setBudget(event.target.value);
                                if (error) setError("");
                            }}
                            placeholder="Enter trip budget"
                            className="rounded-2xl border border-slate-200 px-4 py-3 text-base shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                        />
                    </label>

                    <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        Description
                        <textarea
                            rows={4}
                            value={description}
                            onChange={(event) => {
                                setDescription(event.target.value);
                                if (error) setError("");
                            }}
                            placeholder="Describe the trip, destination, or vibe"
                            className="rounded-2xl border border-slate-200 px-4 py-3 text-base shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                        />
                    </label>

                    <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        Trip date
                        <input
                            type="date"
                            value={date}
                            onChange={(event) => setDate(event.target.value)}
                            className="rounded-2xl border border-slate-200 px-4 py-3 text-base shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                        />
                    </label>

                    {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}

                    <button
                        type="submit"
                        className="mt-2 rounded-2xl bg-pink-500 px-5 py-3 font-semibold text-white transition hover:bg-pink-600"
                    >
                        Create Trip Room
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function CreateRoomPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-300 to-purple-200 text-white">Loading trip details...</div>}>
            <CreateRoomForm />
        </Suspense>
    );
}
