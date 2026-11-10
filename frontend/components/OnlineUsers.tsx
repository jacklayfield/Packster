import type { RoomUser } from "@/types/messages";

type Props = {
  users: RoomUser[];
};

function getInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "?";
}

export default function OnlineUsers({ users }: Props) {
  const onlineUsers = users.filter((user) => user.online);
  if (onlineUsers.length === 0) {
    return null;
  }

  return (
    <div role="list" aria-label="Online room members" className="mb-6 flex flex-wrap gap-4 rounded-2xl bg-white/80 p-4 shadow-md">
      {onlineUsers.map((user) => (
        <div key={user.clientId} role="listitem" className="flex min-w-[72px] flex-col items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm"
            style={{ backgroundColor: user.color }}
            title={`${user.displayName} (online)`}
          >
            {getInitial(user.displayName)}
          </div>
          <span className="max-w-[88px] truncate text-center text-xs font-medium text-gray-700">
            {user.displayName}
          </span>
          <span className="text-[10px] text-gray-500">Online</span>
        </div>
      ))}
    </div>
  );
}
