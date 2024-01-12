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

export const Group = () => {
  const location = useLocation();
  const path = location.pathname.split("/")[2];

  const [groupDetails, setGroupDetails] = useState({
    name: "",
    date: "",
    budget: 0,
    budgetUsed: 0,
  });

  const [listItems, setListItems] = useState([{}]);
  const [loading, setLoading] = useState<Boolean>(false);

  useEffect(() => {
    const fetchGroup = async () => {
      setLoading(true);
      try {
        const res = await axios.get(BASE_URL_API + "/group/id=" + path);
        setGroupDetails(res.data);
      } catch (error) {
        console.log(error);
      }
      setLoading(false);
    };
    fetchGroup();
  }, []);

  return (
    <div className="flex flex-col justify-center items-center pt-24 ">
      <ListHeader data={groupDetails} />
      <List data={data} />
    </div>
  );
};
