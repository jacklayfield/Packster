export type PackingEntry = {
  id: string;
  name: string;
  quantity: number;
  cost: number;
  assignedTo: string;
};

export type RoomInfo = {
  id: string;
  name: string;
};

export type Membership = {
  userId: string;
  displayName: string;
  joinedAt: string;
};

export type User = {
  id: string;
  isGuest: boolean;
  email?: string;
  createdAt: string;
};

export type ClientMessage =
  | { type: "create_room"; roomId: string; roomName: string; userId: string; displayName: string; budget?: string; description?: string; date?: string }
  | { type: "join"; roomId: string; userId: string; displayName: string }
  | { type: "add_entry"; roomId: string; entry: PackingEntry };

export type ServerMessage =
  | { type: "room_snapshot"; room: string; payload: { entries: PackingEntry[]; roomName: string; members: Membership[]; budget?: string; description?: string; date?: string } }
  | { type: "entry_added"; room: string; entry: PackingEntry }
  | { type: "user_joined"; room: string; userId: string; payload: { displayName: string } }
  | { type: "error"; room: string; payload: string };