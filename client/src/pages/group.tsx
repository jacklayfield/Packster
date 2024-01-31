import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Col from "react-bootstrap/esm/Col";
import Row from "react-bootstrap/esm/Row";
import { ListItem } from "../components/listItem";
import { ListHeader } from "../components/listHeader";
import { List } from "../components/list";
import { OnlineUsers } from "../components/onlineUsers";
import data from "../data.json";
import axios from "axios";
import { BASE_URL_API } from "../App";
import { BASE_URL_CLIENT } from "../App";
import { Modal } from "../components/modal";
import * as io from "socket.io-client";
import { ServerToClientEvents, ClientToServerEvents } from "../../../typings";

import { Item, User } from "../../../typings";

interface GPROPS {
  socket: io.Socket<ServerToClientEvents, ClientToServerEvents>;
}

export const Group: React.FC<GPROPS> = ({ socket }) => {
  const location = useLocation();
  const grpId = location.pathname.split("/")[2];

  const [groupDetails, setGroupDetails] = useState({
    name: "",
    date: "",
    budget: 0,
    budgetUsed: 0,
  });

  const [listItems, setListItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState<Boolean>(false);
  const [modalOpen, setModalOpen] = useState<Boolean>(true);
  const [username, setUsername] = useState<string>("n/a");
  const [messages, setMessages] = useState<string[]>([]);
  const [room, setRoom] = useState("");
  const [roomUsers, setRoomUsers] = useState<User[]>([]);

  useEffect(() => {
    const receiveItems = () => {
      socket.on("send_items", (data) => {
        console.log(data);
        setListItems(data.items);
      });
    };

    const receiveUsers = () => {
      socket.on("room_users", (data) => {
        console.log(data.users);
        setRoomUsers(data.users);
      });
      return () => socket.off("room_users");
    };

    const fetchGroup = async () => {
      setLoading(true);
      try {
        const res = await axios.get(BASE_URL_API + "/group/id=" + grpId);
        setGroupDetails(res.data);
      } catch (error) {
        console.log(error);
      }
      setLoading(false);
    };
    fetchGroup();
    receiveUsers();
    receiveItems();
  }, [username, socket]);

  const applyModal = (name: string) => {
    setUsername(name);
    setModalOpen(!modalOpen);

    const room = grpId;

    try {
      if (room !== "" && name !== "") {
        socket.emit("join_room", { name, room });
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleAddClicked = () => {
    // In here we should:
    // A. set new item mode to true
    //   - This will satisfy the conditional render for editable item
    // B. Disable the add group button
    //   - This will ensure the user does not try to add a group while already working on one.

    console.log("add clicked");
    let item: Item = {
      name: "peanuts",
      quantity: 3,
      cost: 7.5,
      usersBringing: ["Connor", "Shashank"],
      usersExempted: ["Bob"],
      required: false,
      groupId: "65ac6d7e46e7ab14e320b1e4",
    };
    socket.emit("send_item", { item, room });
  };

  /**
   * function responsible for sending a new item socket event
   */
  const sendItem = () => {};

  return (
    <>
      {modalOpen && <Modal applyModal={applyModal} />}
      <div className="flex flex-col items-center pt-24 h-screen bg-gray-200">
        <div className="flex flex-row">
          <div className="p-2 rounded-tl-lg rounded-bl-lg bg-violet-400 text-black text-xl">
            Your Shareable Link:{" "}
          </div>
          <div className="p-2 rounded-tr-lg rounded-br-lg bg-violet-800 text-white font-semibold text-xl">
            {BASE_URL_CLIENT + location.pathname}
          </div>
        </div>
        <ListHeader data={groupDetails} />
        <OnlineUsers roomUsers={roomUsers} />
        <List items={listItems} />
        <div
          className="w-[80%] mt-2 text-gray-600 hover:text-gray-900 hover:border-gray-900 hover:bg-gray-300 hover:cursor-pointer border-3 border-dotted border-gray-600 rounded-md px-3 py-3 text-center text-lg"
          onClick={handleAddClicked}
        >
          <span className="fa-solid fa-circle-plus fa-xl"></span> Add an item
        </div>
      </div>
    </>
  );
};
