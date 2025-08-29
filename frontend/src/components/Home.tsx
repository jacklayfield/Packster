import "../styling/Home.css";

type HomeProps = {
  onJoin: (roomId: string) => void;
};

export default function Home({ onJoin }: HomeProps) {
  const numBubbles = 50;

  return (
    <div className="home-container">
      <h1 className="home-title">Where are we going?</h1>
      <div className="input-group">
        <input
          type="text"
          placeholder="Enter trip name"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const value = e.currentTarget.value.trim();
              if (value) onJoin(value);
            }
          }}
        />
        <button onClick={() => onJoin("default")}>Join Room</button>
      </div>

      {Array.from({ length: numBubbles }).map((_, i) => {
        const size = 10 + Math.random() * 25;
        const duration = 5 + Math.random() * 5;
        const delay = Math.random() * 5;
        return (
          <div
            key={i}
            className="bubble"
            style={{
              left: `${Math.random() * 100}%`,
              width: `${size}px`,
              height: `${size}px`,
              animationDuration: `${duration}s`,
              animationDelay: `${delay}s`,
            }}
          />
        );
      })}
    </div>
  );
}
