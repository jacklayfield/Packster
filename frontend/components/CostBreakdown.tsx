"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiDollarSign } from "react-icons/fi";
import { getDisplayName, getGuestId, getRoomParticipantId, setDisplayName as persistDisplayName, setRoomParticipantId } from "@/lib/guest";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { PackingEntry, RoomUser } from "@/types/messages";

type Props = {
    roomId: string;
};

type Payment = {
    fromId: string;
    from: string;
    toId: string;
    to: string;
    amount: number;
};

function calculatePayments(entries: PackingEntry[], participants: RoomUser[]): Payment[] {
    const paid = new Map<string, number>();
    const usersByName = new Map<string, RoomUser[]>();
    for (const participant of participants) {
        usersByName.set(participant.displayName, [...(usersByName.get(participant.displayName) ?? []), participant]);
    }

    for (const entry of entries) {
        if (entry.assignedTo === "Unassigned") continue;
        const ownerId = entry.assignedToId ?? (usersByName.get(entry.assignedTo)?.length === 1
            ? usersByName.get(entry.assignedTo)?.[0].clientId
            : undefined);
        if (ownerId) {
            paid.set(ownerId, (paid.get(ownerId) ?? 0) + entry.cost);
        }
    }

    const participantById = new Map(participants.map((user) => [user.clientId, user]));
    const ids = Array.from(new Set([...participants.map((user) => user.clientId), ...paid.keys()]));
    const total = Array.from(paid.values()).reduce((sum, amount) => sum + amount, 0);
    const share = ids.length > 0 ? total / ids.length : 0;
    const creditors = ids
        .map((id) => ({ id, name: participantById.get(id)?.displayName ?? "Former participant", amount: (paid.get(id) ?? 0) - share }))
        .filter((person) => person.amount > 0.005)
        .sort((a, b) => b.amount - a.amount);
    const debtors = ids
        .map((id) => ({ id, name: participantById.get(id)?.displayName ?? "Former participant", amount: share - (paid.get(id) ?? 0) }))
        .filter((person) => person.amount > 0.005)
        .sort((a, b) => b.amount - a.amount);
    const payments: Payment[] = [];

    let debtorIndex = 0;
    let creditorIndex = 0;
    while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
        const amount = Math.min(debtors[debtorIndex].amount, creditors[creditorIndex].amount);
        payments.push({
            fromId: debtors[debtorIndex].id,
            from: debtors[debtorIndex].name,
            toId: creditors[creditorIndex].id,
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
    const [nameDraft, setNameDraft] = useState("");
    const [nameConflict, setNameConflict] = useState<{ displayName: string; clientId: string } | null>(null);
    const [claimClientId, setClaimClientId] = useState<string | undefined>();
    const [processedMessageCount, setProcessedMessageCount] = useState(0);
    const { messages } = useWebSocket(roomId, { clientId, displayName, claimClientId });
    const participantId = claimClientId ?? clientId;

    useEffect(() => {
        setClientId(getGuestId());
        setClaimClientId(getRoomParticipantId(roomId) || undefined);
        const savedName = getDisplayName();
        setDisplayName(savedName);
        setNameDraft(savedName);
    }, [roomId]);

    useEffect(() => {
        for (let index = processedMessageCount; index < messages.length; index += 1) {
            const message = messages[index];
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
                    setUsers((current) => current.map((user) => (
                        user.clientId === message.payload.clientId ? { ...user, online: false } : user
                    )));
                    break;
                case "error":
                    if (typeof message.payload !== "string" && message.payload.type === "name_conflict") {
                        setNameConflict(message.payload);
                        setDisplayName("");
                    } else {
                        setRoomError(typeof message.payload === "string" ? message.payload : "Unable to join this room");
                    }
                    break;
            }
        }

        if (messages.length > processedMessageCount) {
            setProcessedMessageCount(messages.length);
        }
    }, [messages, processedMessageCount, roomId]);

    const assignedEntries = entries.filter((entry) => entry.assignedTo !== "Unassigned");
    const total = assignedEntries.reduce((sum, entry) => sum + entry.cost, 0);
    const unassignedTotal = entries
        .filter((entry) => entry.assignedTo === "Unassigned")
        .reduce((sum, entry) => sum + entry.cost, 0);
    const participants = users;
    const currentUserColor = users.find((user) => user.clientId === participantId)?.color;
    const payments = calculatePayments(entries, participants);
    const share = participants.length > 0 ? total / participants.length : 0;

    const handleClaimExistingParticipant = () => {
        if (!nameConflict || !clientId || !nameDraft.trim()) return;

        const chosenName = nameDraft.trim();
        persistDisplayName(chosenName);
        setDisplayName(chosenName);
        setClaimClientId(nameConflict.clientId);
        setRoomParticipantId(roomId, nameConflict.clientId);
        setNameConflict(null);
    };

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

    if (nameConflict) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
                <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-500">Packster</p>
                    <h1 className="mt-2 text-2xl font-bold text-slate-800">Is this you?</h1>
                    <p className="mt-2 text-sm text-slate-600">
                        A participant named {nameConflict.displayName} already exists in this room.
                    </p>
                    <div className="mt-6 flex gap-2">
                        <button
                            type="button"
                            onClick={handleClaimExistingParticipant}
                            className="rounded-xl bg-amber-600 px-3 py-2 font-semibold text-white hover:bg-amber-700"
                        >
                            Yes, that&apos;s me
                        </button>
                        <button
                            type="button"
                            onClick={() => router.push(`/room/${roomId}`)}
                            className="rounded-xl bg-slate-100 px-3 py-2 font-semibold text-slate-700 hover:bg-slate-200"
                        >
                            No, go back
                        </button>
                    </div>
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
                                        <strong style={payment.fromId === participantId ? { color: currentUserColor } : undefined}>
                                            {payment.from}
                                        </strong>{" "}pays{" "}
                                        <strong style={payment.toId === participantId ? { color: currentUserColor } : undefined}>
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