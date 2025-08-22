// Messages sent between client and server

export type ClientMessage =
  | { type: "join"; roomId: string }
  | { type: "add_entry"; roomId: string; text: string };

export type ServerMessage =
  | { type: "joined"; roomId: string }
  | { type: "entry_added"; roomId: string; text: string; user: string }
  | { type: "error"; message: string };