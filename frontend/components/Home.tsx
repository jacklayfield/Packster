"use client";

import { useState, useEffect } from "react";
import { useGuestUser } from "@/hooks/useGuestUser";

type HomeProps = {
  onJoin: (roomId: string) => void;
};

export default function Home({ onJoin }: HomeProps) {
  const [tripName, setTripName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isCreating, setIsCreating] = useState(true);
  const [showNameInput, setShowNameInput] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: "create" | "join"; value?: string } | null>(null);
  const { displayName: storedDisplayName, updateDisplayName } = useGuestUser();
  const numBubbles = 50;

  const [bubbles, setBubbles] = useState<Array<{
    id: number;
    left: string;
    size: number;
    duration: number;
    delay: number;
  }>>([]);

  useEffect(() => {
    // Generate bubbles only on client side to avoid hydration mismatch
    const generateBubbles = () => {
      return Array.from({ length: numBubbles }).map((_, i) => {
        const size = 10 + Math.random() * 25;
        const duration = 5 + Math.random() * 5;
        const delay = Math.random() * 5;
        return {
          id: i,
          left: `${Math.random() * 100}%`,
          size,
          duration,
          delay,
        };
      });
    };

    setBubbles(generateBubbles());

    // Initialize display name if already set
    if (storedDisplayName) {
      setDisplayName(storedDisplayName);
    }
  }, [storedDisplayName, numBubbles]);

  const handleProceedWithName = () => {
    if (displayName.trim()) {
      updateDisplayName(displayName);
      setShowNameInput(false);

      // Auto-proceed with the pending action
      if (pendingAction) {
        if (pendingAction.type === "create") {
          const value = tripName.trim();
          if (value) {
            if (typeof window !== "undefined") {
              sessionStorage.setItem("packster_temp_room_name", value);
            }
          } else {
            if (typeof window !== "undefined") {
              sessionStorage.setItem("packster_temp_room_name", "My Trip");
            }
          }
          onJoin("");
        } else if (pendingAction.type === "join") {
          onJoin(pendingAction.value || "");
        }
        setPendingAction(null);
      }
    }
  };

  const handleCreateRoom = () => {
    if (!displayName.trim()) {
      setPendingAction({ type: "create", value: tripName });
      setShowNameInput(true);
      return;
    }

    const value = tripName.trim();
    if (value) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("packster_temp_room_name", value);
      }
      onJoin("");
    } else {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("packster_temp_room_name", "My Trip");
      }
      onJoin("");
    }
  };

  const handleJoinRoom = () => {
    if (!displayName.trim()) {
      const value = roomId.trim();
      setPendingAction({ type: "join", value });
      setShowNameInput(true);
      return;
    }

    const value = roomId.trim();
    if (value) {
      onJoin(value);
    } else {
      alert("Please enter a room ID");
    }
  };

  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-blue-300 to-purple-200 flex flex-col items-center justify-start pt-[20vh] overflow-hidden font-sans">
      <h1 className="text-4xl font-bold mb-8 text-white drop-shadow-md">
        Packster
      </h1>

      {showNameInput && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">What's your name?</h2>
            <p className="text-gray-600 mb-4">Enter your display name for this trip</p>
            <input
              type="text"
              placeholder="Enter your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleProceedWithName(); }}
              autoFocus
              className="w-full px-4 py-2 rounded-lg border-2 border-blue-300 outline-none focus:border-blue-500 text-black mb-4"
            />
            <button
              onClick={handleProceedWithName}
              className="w-full px-4 py-2 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center">
        {/* Toggle buttons */}
        <div className="flex gap-2 mb-6 bg-white/20 rounded-xl p-1">
          <button
            onClick={() => setIsCreating(true)}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${isCreating
              ? "bg-white text-blue-600 shadow-md"
              : "text-white hover:bg-white/10"
              }`}
          >
            Create Room
          </button>
          <button
            onClick={() => setIsCreating(false)}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${!isCreating
              ? "bg-white text-blue-600 shadow-md"
              : "text-white hover:bg-white/10"
              }`}
          >
            Join Room
          </button>
        </div>

        {isCreating ? (
          <div className="flex flex-col gap-3 mb-8">
            <input
              type="text"
              placeholder="Enter trip name"
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreateRoom(); }}
              className="px-4 py-2 rounded-xl border-none outline-none shadow-md text-black"
            />
            <button
              onClick={handleCreateRoom}
              className="px-5 py-2 rounded-xl bg-pink-400 text-white font-semibold hover:bg-pink-600 transition-transform transform hover:scale-105"
            >
              Create Room
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 mb-8">
            <input
              type="text"
              placeholder="Enter room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleJoinRoom(); }}
              className="px-4 py-2 rounded-xl border-none outline-none shadow-md text-black"
            />
            <button
              onClick={handleJoinRoom}
              className="px-5 py-2 rounded-xl bg-green-400 text-white font-semibold hover:bg-green-600 transition-transform transform hover:scale-105"
            >
              Join Room
            </button>
          </div>
        )}
      </div>

      {bubbles.map((b) => (
        <div
          key={b.id}
          className="absolute bottom-[-50px] bg-white rounded-full animate-rise pointer-events-none"
          style={{
            left: b.left,
            width: `${b.size}px`,
            height: `${b.size}px`,
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}

      <style jsx>{`
        @keyframes rise {
          from {
            transform: translateY(0) scale(1);
            opacity: 0.6;
          }
          to {
            transform: translateY(-120vh) scale(1.2);
            opacity: 0;
          }
        }
        .animate-rise {
          animation: rise linear infinite;
        }
      `}</style>
    </div>
  );
}
