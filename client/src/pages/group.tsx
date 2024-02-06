import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Col from "react-bootstrap/esm/Col";
import Row from "react-bootstrap/esm/Row";
import { GroupHeader } from "../components/groupHeader";
import { List } from "../components/list";
import { OnlineUsers } from "../components/onlineUsers";
import axios from "axios";
import { BASE_URL_API } from "../App";
import { BASE_URL_CLIENT } from "../App";
import { Modal } from "../components/modal";
import * as io from "socket.io-client";
import { ServerToClientEvents, ClientToServerEvents } from "../../../typings";

import { Item, User } from "../../../typings";
import { EditableItem } from "../components/editableItem";

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
  const [roomUsers, setRoomUsers] = useState<User[]>([]);
  // const [createItem, setCreateItem] = useState<Boolean>(false);

  useEffect(() => {
    socket.on("receive_items", (data) => {
      console.log("receive_items");
      console.log(data);
      setListItems(data.items);
    });

    // Remove event listener on component unmount
    return () => {
      socket.off("receive_items");
    };
  }, [socket]);

  useEffect(() => {
    socket.on("room_users", (data) => {
      console.log(data.users);
      setRoomUsers(data.users);
    });

    // Remove event listener on component unmount
    return () => {
      socket.off("room_users");
    };
  }, [socket]);

  useEffect(() => {
    socket.on("receive_item", (data) => {
      console.log("recEIVE");
      console.log(data);
      setListItems((state) => [
        ...state,
        {
          name: data.item.name,
          quantity: data.item.quantity,
          cost: data.item.cost,
          usersBringing: data.item.usersBringing,
          usersExempted: data.item.usersExempted,
          required: data.item.required,
          groupId: data.item.groupId,
        },
      ]);
    });

    // Remove event listener on component unmount
    return () => {
      socket.off("receive_item");
    };
  }, [socket]);

  useEffect(() => {
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
  }, [username, grpId]);

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

  const handleAddClicked = () => {};

  let item: Item = {
    name: "peanuts15",
    quantity: 3,
    cost: 7.5,
    usersBringing: ["Connor", "Shashank"],
    usersExempted: ["Bob"],
    required: false,
    groupId: "65bc486442a9af7a3e70a51e",
  };

  if (loading) {
    return <div>Loading...</div>;
  }
  return (
    <div className="h-screen">
      {modalOpen && <Modal applyModal={applyModal} />}
      <div className="flex flex-col items-center pt-24 min-h-full m bg-gray-200">
        <div className="flex flex-row">
          <div className="p-2 rounded-tl-lg rounded-bl-lg bg-violet-400 text-black text-xl">
            Your Shareable Link:{" "}
          </div>
          <div className="p-2 rounded-tr-lg rounded-br-lg bg-violet-800 text-white font-semibold text-xl">
            {BASE_URL_CLIENT + location.pathname}
          </div>
        </div>
        <GroupHeader data={groupDetails} />

        <div className="w-[80%]">
          <OnlineUsers roomUsers={roomUsers} />

          <div className=" bg-gray-200 rounded-md pl-3 pr-3 pt-6 pb-6 text-center text-xl mt-30 font-bold">
            <Row>
              <Col>Name</Col>
              <Col>Quantity</Col>
              <Col>Cost per</Col>
              <Col>Required?</Col>
              <Col>Who's packing</Col>
              <Col>Will not use</Col>
              <Col>Click to claim</Col>
            </Row>
          </div>
          <div
            className="mt-2 mb-2 text-gray-600 hover:text-gray-900 hover:border-gray-900 hover:bg-gray-300 hover:cursor-pointer border-3 border-dotted border-gray-600 rounded-md px-3 py-3 text-center text-lg"
            onClick={handleAddClicked}
          >
            <span className="fa-solid fa-circle-plus fa-xl"></span> Add an item
          </div>

          <EditableItem item={item} />

          <List items={listItems} />
        </div>
      </div>
    </div>
  );
};
