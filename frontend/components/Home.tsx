"use client";

import { useState, useMemo } from "react";

type HomeProps = {
  onJoin: (roomId: string) => void;
};

export default function Home({ onJoin }: HomeProps) {
  const [tripName, setTripName] = useState("");
  const numBubbles = 50;

  const bubbles = useMemo(() => {
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
  }, [numBubbles]);

  const handleJoin = () => {
    const value = tripName.trim();
    if (value) onJoin(value);
  };

  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-blue-300 to-purple-200 flex flex-col items-center justify-start pt-[25vh] overflow-hidden font-sans">
      <h1 className="text-4xl font-bold mb-6 text-white drop-shadow-md">
        Where are we going?
      </h1>

      <div className="flex gap-3 mb-8">
        <input
          type="text"
          placeholder="Enter trip name"
          value={tripName}
          onChange={(e) => setTripName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleJoin(); }}
          className="px-4 py-2 rounded-xl border-none outline-none shadow-md text-black"
        />
        <button
          onClick={handleJoin}
          className="px-5 py-2 rounded-xl bg-pink-400 text-white font-semibold hover:bg-pink-600 transition-transform transform hover:scale-105"
        >
          Join Room
        </button>
      </div>

      {bubbles.map((b) => (
        <div
          key={b.id}
          className="absolute bottom-[-50px] bg-white rounded-full animate-rise"
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
