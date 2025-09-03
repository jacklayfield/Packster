export type PackingEntry = {
  id: string;
  name: string;
  quantity: number;
  cost: number;
  assignedTo: string;
};

export type ClientMessage =
  | { type: "add_entry"; roomId: string; entry: PackingEntry };

export type ServerMessage =
  | { type: "room_snapshot"; room: string; payload: PackingEntry[] }
  | { type: "entry_added"; room: string; entry: PackingEntry }
  | { type: "error"; message: string };