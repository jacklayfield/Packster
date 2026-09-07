"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiDollarSign } from "react-icons/fi";
import { getDisplayName, getGuestId } from "@/lib/guest";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { PackingEntry, RoomUser } from "@/types/messages";

type Props = {
    roomId: string;
};

type Payment = {
    from: string;
    to: string;
    amount: number;
};

function calculatePayments(entries: PackingEntry[], participants: string[]): Payment[] {
    const paid = new Map<string, number>();

    for (const entry of entries) {
        if (entry.assignedTo !== "Unassigned") {
            paid.set(entry.assignedTo, (paid.get(entry.assignedTo) ?? 0) + entry.cost);
        }
    }

    const names = Array.from(new Set([...participants, ...paid.keys()]));
    const total = Array.from(paid.values()).reduce((sum, amount) => sum + amount, 0);
    const share = names.length > 0 ? total / names.length : 0;
    const creditors = names
        .map((name) => ({ name, amount: (paid.get(name) ?? 0) - share }))
        .filter((person) => person.amount > 0.005)
        .sort((a, b) => b.amount - a.amount);
    const debtors = names
        .map((name) => ({ name, amount: share - (paid.get(name) ?? 0) }))
        .filter((person) => person.amount > 0.005)
        .sort((a, b) => b.amount - a.amount);
    const payments: Payment[] = [];

    let debtorIndex = 0;
    let creditorIndex = 0;
    while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
        const amount = Math.min(debtors[debtorIndex].amount, creditors[creditorIndex].amount);
        payments.push({
            from: debtors[debtorIndex].name,
            to: creditors[creditorIndex].name,
            amount,
        });
        debtors[debtorIndex].amount -= amount;
        creditors[creditorIndex].amount -= amount;
        if (debtors[debtorIndex].amount < 0.005) debtorIndex += 1;
        if (creditors[creditorIndex].amount < 0.005) creditorIndex += 1;
    }

    return payments;
}

export default function CostBreakdown({ roomId }: Props) {
    const router = useRouter();
    const [clientId, setClientId] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [entries, setEntries] = useState<PackingEntry[]>([]);
    const [users, setUsers] = useState<RoomUser[]>([]);
    const [roomName, setRoomName] = useState(roomId);
    const [loaded, setLoaded] = useState(false);
    const [roomError, setRoomError] = useState("");
    const { messages } = useWebSocket(roomId, { clientId, displayName });

    useEffect(() => {
        setClientId(getGuestId());
        setDisplayName(getDisplayName());
    }, []);

    useEffect(() => {
        for (const message of messages) {
            switch (message.type) {
                case "room_snapshot":
                    setEntries(message.payload.entries ?? []);
                    setRoomName(message.payload.roomName || roomId);
                    setLoaded(true);
                    break;
                case "entry_added":
                    setEntries((current) => {
                        const index = current.findIndex((entry) => entry.id === message.entry.id);
                        if (index === -1) return [...current, message.entry];
                        const next = [...current];
                        next[index] = message.entry;
                        return next;
                    });
                    break;
                case "entry_deleted":
                    setEntries((current) => current.filter((entry) => entry.id !== message.entryId));
                    break;
                case "presence_snapshot":
                    setUsers(message.payload.users ?? []);
                    break;
                case "user_joined":
                    setUsers((current) => [
                        ...current.filter((user) => user.clientId !== message.payload.user.clientId),
                        message.payload.user,
                    ]);
                    break;
                case "user_left":
                    setUsers((current) => current.filter((user) => user.clientId !== message.payload.clientId));
                    break;
                case "error":
                    setRoomError(message.payload);
                    break;
            }
        }
    }, [messages, roomId]);

    const assignedEntries = entries.filter((entry) => entry.assignedTo !== "Unassigned");
    const total = assignedEntries.reduce((sum, entry) => sum + entry.cost, 0);
    const unassignedTotal = entries
        .filter((entry) => entry.assignedTo === "Unassigned")
        .reduce((sum, entry) => sum + entry.cost, 0);
    const participants = users.map((user) => user.displayName);
    const currentUserColor = users.find((user) => user.displayName === displayName)?.color;
    const payments = calculatePayments(entries, participants);
    const share = participants.length > 0 ? total / participants.length : 0;

    if (roomError) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
                <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl">
                    <h1 className="text-2xl font-bold text-slate-800">Room not found</h1>
                    <p className="mt-2 text-slate-600">This room may have been deleted or the link may be incorrect.</p>
                    <button
                        type="button"
                        onClick={() => router.push("/")}
                        className="mt-6 rounded-xl bg-blue-500 px-5 py-3 font-semibold text-white transition hover:bg-blue-600"
                    >
                        Return home
                    </button>
                </div>
            </div>
        );
    }

    if (!displayName || !loaded) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
                <p className="font-semibold text-slate-700">Loading cost breakdown...</p>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
            <div className="mx-auto max-w-4xl">
                <button
                    type="button"
                    onClick={() => router.push(`/room/${roomId}`)}
                    className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-600"
                >
                    <FiArrowLeft /> Back to room
                </button>

                <div className="mb-8 flex items-start justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-500">{roomName}</p>
                        <h1 className="mt-2 text-4xl font-bold tracking-tight">Who owes who?</h1>
                        <p className="mt-2 max-w-xl text-slate-600">
                            Costs are split evenly between everyone currently in the room. Claimed items count as paid by the person who claimed them.
                        </p>
                    </div>
                    <FiDollarSign className="hidden h-12 w-12 text-blue-500 sm:block" aria-hidden="true" />
                </div>

                <section className="mb-6 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">Shared total</p>
                        <p className="mt-1 text-2xl font-bold">${total.toFixed(2)}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">People splitting it</p>
                        <p className="mt-1 text-2xl font-bold">{participants.length}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">Each person&apos;s share</p>
                        <p className="mt-1 text-2xl font-bold">${share.toFixed(2)}</p>
                    </div>
                </section>

                <section className="rounded-2xl bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-bold">Suggested payments</h2>
                    {payments.length === 0 ? (
                        <p className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
                            Everyone is settled up.
                        </p>
                    ) : (
                        <div className="mt-4 space-y-3">
                            {payments.map((payment, index) => (
                                <div key={`${payment.from}-${payment.to}-${index}`} className="flex items-center justify-between rounded-xl bg-blue-50 px-4 py-3">
                                    <span>
                                        <strong style={payment.from === displayName ? { color: currentUserColor } : undefined}>
                                            {payment.from}
                                        </strong>{" "}pays{" "}
                                        <strong style={payment.to === displayName ? { color: currentUserColor } : undefined}>
                                            {payment.to}
                                        </strong>
                                    </span>
                                    <strong className="text-blue-700">${payment.amount.toFixed(2)}</strong>
                                </div>
                            ))}
                        </div>
                    )}
                    {unassignedTotal > 0 && (
                        <p className="mt-5 text-sm text-amber-700">
                            ${unassignedTotal.toFixed(2)} is not included yet because those items have not been claimed.
                        </p>
                    )}
                </section>
            </div>
        </main>
    );
}