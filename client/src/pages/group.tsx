import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Col from "react-bootstrap/esm/Col";
import Row from "react-bootstrap/esm/Row";
import { ListItem } from "../components/listItem";
import { ListHeader } from "../components/listHeader";
import { List } from "../components/list";
import data from "../data.json";
import axios from "axios";
import { BASE_URL_API } from "../App";
import { BASE_URL_CLIENT } from "../App";
import { Modal } from "../components/modal";
import * as io from "socket.io-client";
import { ServerToClientEvents, ClientToServerEvents } from "../../../typings";

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

  const [listItems, setListItems] = useState([{}]);
  const [loading, setLoading] = useState<Boolean>(false);
  const [modalOpen, setModalOpen] = useState<Boolean>(true);
  const [username, setUsername] = useState<String>("n/a");
  const [messages, setMessages] = useState<string[]>([]);
  const [room, setRoom] = useState("");

  useEffect(() => {
    const joinRoom = () => {
      // try {
      //   if (grpId !== "" && username !== "") {
      //     socket.emit("join_room", { username, room });
      //   }
      // } catch (error) {
      //   console.log(error);
      // }
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
  }, [username]);

  const applyModal = (name: String) => {
    setUsername(name);
    setModalOpen(!modalOpen);

    const room = grpId;
    const msg = "connection";

    try {
      if (room !== "" && username !== "") {
        console.log("in here");
        socket.emit("clientMsg", { msg, room });
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      {modalOpen && <Modal applyModal={applyModal} />}
      <div className="flex flex-col justify-center items-center pt-24 ">
        <div className="flex flex-row">
          <div className="p-2 rounded-tl-lg rounded-bl-lg bg-purple-300 text-black text-xl">
            Your Shareable Link:{" "}
          </div>
          <div className="p-2 rounded-tr-lg rounded-br-lg bg-purple-900 text-white font-semibold text-xl">
            {BASE_URL_CLIENT + location.pathname}
          </div>
        </div>
        <ListHeader data={groupDetails} />

        <List data={data} />
      </div>
    </>
  );
};
