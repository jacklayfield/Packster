import { useState } from "react";

type Props = { onAdd: (text: string) => void };

export default function EntryForm({ onAdd }: Props) {
  const [text, setText] = useState("");

  return (
    <div>
      <input
        value={text}
        placeholder="New entry"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onAdd(text);
            setText("");
          }
        }}
      />
      <button
        onClick={() => {
          onAdd(text);
          setText("");
        }}
      >
        Add
      </button>
    </div>
  );
}
