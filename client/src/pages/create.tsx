import tree from "../images/palm_tree.png";
import mountains from "../images/mountains4.png";
import axios from "axios";
import { useState } from "react";
import { group } from "console";

export const Create = () => {
  const [groupDetails, setGroupDetails] = useState({
    name: "",
    date: "",
    budget: "",
  });

  const numRegex = /^[0-9\b]+$/;

  const handleCreateGroup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (
      !(event.target.name === "budget") ||
      numRegex.test(event.target.value)
    ) {
      setGroupDetails((prev) => ({
        ...prev,
        [event.target.name]: event.target.value,
      }));
    }
    console.log(groupDetails);
  };

  return (
    <>
      <div className="flex flex-col justify-center items-center h-screen create-page">
        <h1 className="text-7xl -mt-48 text-white pb-6 drop-shadow-lg">
          What we doin?
        </h1>
        <form
          onSubmit={handleCreateGroup}
          className="flex flex-col justify-center items-center"
        >
          <input
            className="z-1 h-20 w-96 pr-6 pl-6 mb-6 bg-gray-200 drop-shadow-lg text-2xl rounded-3xl z-0 focus:shadow focus:outline-none"
            type="text"
            placeholder="Enter event/trip name"
            name="name"
            required={true}
            onChange={handleChange}
          />
          <input
            className="z-1 h-12 w-72 pr-6 pl-6 mb-6 bg-gray-200 drop-shadow-lg text-xl rounded-3xl z-0 focus:shadow focus:outline-none"
            type="text"
            placeholder="Departure date (Optional)"
            name="date"
            onChange={handleChange}
          />
          <input
            className="z-1 h-12 w-72 pr-6 pl-6 mb-6 bg-gray-200 drop-shadow-lg text-xl rounded-3xl z-0 focus:shadow focus:outline-none"
            type="text"
            placeholder="$ Budget (Optional)"
            name="budget"
            onChange={handleChange}
          />
          <button
            className="z-1 bg-gray-900 hover:bg-gray-800 hover:cursor- text-white text-lg font-bold py-2 px-4 rounded"
            type="submit"
          >
            Create Group
          </button>
        </form>

        <div className="flex justify-center position-absolute bottom-2">
          <a className="p-3 z-1 text-white font-medium no-underline" href="/#">
            About us
          </a>
          <a className="p-3 z-1 text-white font-medium no-underline" href="/#">
            Contact
          </a>
          <a className="p-3 z-1 text-white font-medium no-underline" href="/#">
            Privacy
          </a>
        </div>
      </div>
      <img
        className="h-4/6 z-0 position-absolute bottom-0 right-12"
        src={tree}
        alt="palm"
      />
      <img
        className="h-3/6 z-0 position-absolute bottom-0"
        src={mountains}
        alt="mtn"
      />
    </>
  );
};
