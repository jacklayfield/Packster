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
            className={
              "p-2 m-1 rounded-2xl text-black text-sm font-semibold border-2 border-solid border-gray-700"
            }
            style={{ backgroundColor: user.color }}
          >
            {user.name}
          </div>
        </div>
      ))}
    </div>
  );
};