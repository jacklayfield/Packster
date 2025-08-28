import { useState } from "react";

type Props = { onAdd: (text: string) => void };

export default function EntryForm({ onAdd }: Props) {
  const [text, setText] = useState("");

  const submit = () => {
    if (!text.trim()) return;
    onAdd(text.trim());
    setText("");
  };

  return (
    <>
      <input
        value={text}
        placeholder="New entry"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
      />
      <button onClick={submit}>Add</button>
    </>
  );
}