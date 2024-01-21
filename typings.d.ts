export interface ServerToClientEvents {
  serverMsg: (data: { msg: string; room: string }) => void;
  room_users: (date: { users: User[] }) => void;
}

export interface ClientToServerEvents {
  clientMsg: (data: { msg: string; room: string }) => void;
  join_room: (data: { name: string; room: string }) => void;
  send_item: (data: { item: Item }) => void;
  leave_room: (data: { name: string; room: string }) => void;
}

export type Item = {
  name: string;
  quantity: number;
  cost: number;
  usersBringing: string[];
  usersExempted: string[];
  required: boolean;
};

export type User = {
  id: string;
  name: string;
  room: string;
  color: string;
};
