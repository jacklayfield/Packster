import { useState, useMemo } from "react";
import "../styling/Home.css";

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
    if (value) {
      onJoin(value);
    }
  };

  return (
    <div className="home-container">
      <h1 className="home-title">Where are we going?</h1>
      <div className="input-group">
        <input
          type="text"
          placeholder="Enter trip name"
          value={tripName}
          onChange={(e) => setTripName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleJoin();
          }}
        />
        <button onClick={handleJoin}>Join Room</button>
      </div>

      {bubbles.map((b) => (
        <div
          key={b.id}
          className="bubble"
          style={{
            left: b.left,
            width: `${b.size}px`,
            height: `${b.size}px`,
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
