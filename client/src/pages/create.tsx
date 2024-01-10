import tree from "../images/palm_tree.png";
import mountains from "../images/mountains4.png";
import axios from "axios";
import { SetStateAction, useState } from "react";
import { group } from "console";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import { BASE_URL_API } from "./../App";

import "react-datepicker/dist/react-datepicker.css";

const motd = [
  "What's the plan?",
  "Camping?",
  "Where to?",
  "What we doin?",
  "Beach?",
  "How about Caving?",
  "Skiing?",
  "Cool event below ↓",
];

const selected_motd = motd[Math.floor(Math.random() * motd.length)];

export const Create = () => {
  const [groupDetails, setGroupDetails] = useState({
    name: "",
    budget: "",
  });
  const [startDate, setStartDate] = useState(new Date());

  const numRegex = /^\d*\.?\d*$/;
  const navigate = useNavigate();

  const handleCreateGroup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    console.log(BASE_URL_API);

    axios
      .post(BASE_URL_API + "/group/create", {
        data: { ...groupDetails, date: startDate },
      })
      .catch((error) => {
        console.log(error);
      })
      .then(
        (res) =>
          res?.status === 200 && navigate("/group/" + res.data.insertedId)
      );
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (
      !(event.target.name === "budget") ||
      event.target.value === "" ||
      numRegex.test(event.target.value)
    ) {
      console.log("in");
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
          {selected_motd}
        </h1>
        <form
          onSubmit={handleCreateGroup}
          className="z-1 flex flex-col justify-center items-center"
        >
          <input
            className="h-20 w-96 pr-6 pl-6 bg-gray-200 drop-shadow-lg text-2xl rounded-3xl focus:shadow focus:outline-none"
            type="text"
            placeholder="Enter event/trip name"
            name="name"
            required={true}
            value={groupDetails.name}
            onChange={handleChange}
          />
          <DatePicker
            className="h-12 w-72 pr-6 pl-6 mt-6 bg-gray-200 drop-shadow-lg text-xl rounded-3xl focus:shadow focus:outline-none"
            selected={startDate}
            onChange={(date) => setStartDate(date ? date : new Date())}
            portalId="root-portal"
            dateFormat="MM-dd-yyyy"
            placeholderText="Choose a departure date"
          />
          <input
            className="h-12 w-72 pr-6 pl-6 mt-6 bg-gray-200 drop-shadow-lg text-xl rounded-3xl focus:shadow focus:outline-none"
            type="text"
            placeholder="$ Budget (ex. 30.50)"
            name="budget"
            value={groupDetails.budget}
            onChange={handleChange}
          />
          <button
            className="mt-6 bg-gray-900 hover:bg-gray-800 hover:cursor- text-white text-lg font-bold py-2 px-4 rounded"
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
