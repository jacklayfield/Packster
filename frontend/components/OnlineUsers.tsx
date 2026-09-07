import type { RoomUser } from "@/types/messages";

type Props = {
  users: RoomUser[];
};

function getInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "?";
}

export default function OnlineUsers({ users }: Props) {
  if (users.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 rounded-2xl bg-white/80 p-4 shadow-md">
      <div className="flex flex-wrap gap-4">
        {users.map((user) => (
          <div key={user.clientId} className="flex min-w-[72px] flex-col items-center gap-2">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm"
              style={{ backgroundColor: user.color }}
              title={user.displayName}
            >
              {getInitial(user.displayName)}
            </div>
            <span className="max-w-[88px] truncate text-center text-xs font-medium text-gray-700">
              {user.displayName}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
