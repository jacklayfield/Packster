import { useState } from "react";
import Room from "./components/Room";

function App() {
  const [roomId, setRoomId] = useState<string | null>(null);

  return (
    <div className="p-6">
      <h1>Group Packing App</h1>
      {roomId ? (
        <Room roomId={roomId} />
      ) : (
        <div>
          <input
            type="text"
            placeholder="Enter Room ID"
            onKeyDown={(e) => {
              if (e.key === "Enter") setRoomId(e.currentTarget.value);
            }}
          />
          <button onClick={() => setRoomId("default")}>Join Default Room</button>
        </div>
      )}
    </div>
  );
}

export default App;
