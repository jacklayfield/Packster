export interface ServerToClientEvents {
  serverMsg: (data: { msg: string; room: string }) => void;
}

export interface ClientToServerEvents {
  clientMsg: (data: { msg: string; room: string }) => void;
  join_room: (data: { username: string; room: string }) => void;
  send_item: (data: { item: Item }) => void;
  leave_room: (data: { username: string; room: string }) => void;
}

export type Item = {
  name: string;
  quantity: number;
  cost: number;
  usersBringing: string[];
  usersExempted: string[];
  required: boolean;
};
