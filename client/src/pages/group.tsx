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

export const Group = () => {
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
  const [modalOpen, setModalOpen] = useState(true);

  useEffect(() => {
    // const joinRoom = () => {
    //   try {
    //     if (grpId !== "" && username !== "") {
    //       socket.emit("join_room", { username, room });
    //     }
    //   } catch (error) {
    //     console.log(error);
    //   }
    // };

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
  }, []);

  return (
    <>
      {modalOpen && <Modal setOpenModal={setModalOpen} />}
      <div className="flex flex-col justify-center items-center pt-24 ">
        <div className="flex flex-row">
          <div className="bubble style-1">Your Shareable Link: </div>
          <div className="bubble style-2">
            {BASE_URL_CLIENT} {location.pathname}
          </div>
        </div>
        <ListHeader data={groupDetails} />

        <List data={data} />
      </div>
    </>
  );
};
