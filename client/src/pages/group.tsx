import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Col from "react-bootstrap/esm/Col";
import Row from "react-bootstrap/esm/Row";
import { GroupHeader } from "../components/groupHeader";
import { List } from "../components/list";
import { OnlineUsers } from "../components/onlineUsers";
import axios from "axios";
import { BASE_URL_API } from "../App";
import { Modal } from "../components/modal";
import * as io from "socket.io-client";
import { ServerToClientEvents, ClientToServerEvents } from "../../../typings";

import { Item, User } from "../../../typings";
import { Loading } from "../components/loading";

interface GPROPS {
  socket: io.Socket<ServerToClientEvents, ClientToServerEvents>;
}

export const Group: React.FC<GPROPS> = ({ socket }) => {
  const location = useLocation();
  const grpId: string = location.pathname.split("/")[2];

  const [loading, setLoading] = useState<Boolean>(false);
  const [modalOpen, setModalOpen] = useState<Boolean>(true);
  const [username, setUsername] = useState<string>("n/a");
  const [roomUsers, setRoomUsers] = useState<User[]>([]);
  const [budgetUsed, setBudgetUsed] = useState<number>(0);
  const [listItems, setListItems] = useState<Item[]>([]);

  const [groupDetails, setGroupDetails] = useState({
    name: "",
    date: "",
    budget: 0,
    grpId: "",
  });

  useEffect(() => {
    const fetchGroup = async () => {
      setLoading(true);
      try {
        const res = await axios.get(BASE_URL_API + "/group/id=" + grpId);
        res.data.grpId = grpId;
        setGroupDetails(res.data);
      } catch (error) {
        console.log(error);
      }
      setLoading(false);
    };
    fetchGroup();
  }, [username, grpId]);

  useEffect(() => {
    socket.on("receive_items", (data) => {
      setListItems(data.items);
    });

    // Remove event listener on component unmount
    return () => {
      socket.off("receive_items");
    };
  }, [socket]);

  useEffect(() => {
    socket.on("room_users", (data) => {
      setRoomUsers(data.users);
    });

    // Remove event listener on component unmount
    return () => {
      socket.off("room_users");
    };
  }, [socket]);

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

  if (loading) {
    return <Loading />;
  }
  return (
    <div className="h-screen">
      {modalOpen && <Modal applyModal={applyModal} />}
      <div className="pb-8 flex flex-col items-center pt-24 min-h-full m bg-gray-200">
        <div className="w-75 mt-3 "></div>
        <GroupHeader
          data={groupDetails}
          budgetUsed={listItems.reduce(
            (sum, obj) => sum + obj.cost * obj.quantity,
            0
          )}
        />

        <div className="w-[80%]">
          <OnlineUsers roomUsers={roomUsers} />

          <div className=" bg-gray-200 rounded-md pl-3 pr-3 pt-3 pb-3 text-center text-xl mt-30 font-bold">
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

          <List
            grpId={grpId}
            socket={socket}
            listItems={listItems}
            setListItems={setListItems}
          />
        </div>
      </div>
    </div>
  );
};
