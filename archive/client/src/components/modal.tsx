import React, { useState } from "react";
interface PPROPS {
  applyModal: Function;
}

export const Modal: React.FC<PPROPS> = ({ applyModal }) => {
  const [name, setName] = useState<String>("");
  return (
    <div className="z-2 w-screen h-screen bg-gray-200/[0.8] fixed flex items-center justify-center">
      <div className="w-[600px] h-[300px] rounded-2xl bg-white drop-shadow-2xl flex flex-col p-25">
        <div className="block text-center basis-1/5 mt-3">
          <h1>What's your name?</h1>
        </div>
        <div className="flex justify-center basis-3/5 items-center">
          <input
            className="h-20 w-96 pr-6 pl-6 bg-blue-100 drop-shadow-lg text-2xl rounded-3xl focus:shadow focus:outline-none"
            type="text"
            placeholder="Enter a username for the room"
            name="name"
            onChange={(e) => {
              setName(e.target.value);
            }}
          />
        </div>
        <div className="flex justify-center basis-1/5 mb-3">
          <button
            className="bg-blue-400 hover:bg-blue-500 hover:cursor- text-white text-lg font-bold py-2 px-4 rounded"
            onClick={() => {
              name !== "" && applyModal(name);
            }}
          >
            Join Room
          </button>
        </div>
      </div>
    </div>
  );
};
