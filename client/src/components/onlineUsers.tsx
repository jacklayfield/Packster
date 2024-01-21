import { User } from "../../../typings";

interface OPROPS {
  roomUsers: User[];
}

export const OnlineUsers: React.FC<OPROPS> = ({ roomUsers }) => {
  return (
    <div className="flex flex-row mt-2">
      <div className="w-50 m-auto font-semibold text-lg">Online: </div>
      {roomUsers.map((user, i) => (
        <div key={i}>
          <div
            className={"p-2 m-1 rounded-lg text-black text-sm font-semibold"}
            style={{ backgroundColor: user.color }}
          >
            {user.name}
          </div>
        </div>
      ))}
    </div>
  );
};
