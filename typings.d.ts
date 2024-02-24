export interface ServerToClientEvents {
  serverMsg: (data: { msg: string; room: string }) => void;
  room_users: (date: { users: User[] }) => void;
  receive_items: (data: { items: Item[] }) => void;
  receive_item: (data: { item: Item; clientId: string }) => void;
}

export interface ClientToServerEvents {
  clientMsg: (data: { msg: string; room: string }) => void;
  join_room: (data: { name: string; room: string }) => void;
  send_item: (data: { item: Item; room: string; clientId: string }) => void;
  leave_room: (data: { name: string; room: string }) => void;
}

export type Item = {
  name: string;
  quantity: number;
  cost: number;
  usersBringing: string[];
  usersExempted: string[];
  required: boolean;
  groupId: string;
};

export type User = {
  id: string;
  name: string;
  room: string;
  color: string;
};
