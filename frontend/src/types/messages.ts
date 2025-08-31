export type PackingEntry = {
  id: string;
  name: string;
  quantity: number;
  cost: number;
  assignedTo: string;
};

export type ClientMessage =
  | { type: "join"; roomId: string }
  | { type: "add_entry"; roomId: string; entry: PackingEntry };

export type ServerMessage =
  | { type: "joined"; roomId: string }
  | { type: "entry_added"; entry: PackingEntry }
  | { type: "sync"; payload: { items: PackingEntry[] } }
  | { type: "error"; message: string };