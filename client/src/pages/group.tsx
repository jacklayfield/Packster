import Col from "react-bootstrap/esm/Col";
import Row from "react-bootstrap/esm/Row";
import { ListItem } from "../components/listItem";
import { ListHeader } from "../components/listHeader";
import { List } from "../components/list";
import data from "../data.json";
export const Group = () => {
  const defaultListItem = {
    name: "test",
    require: true,
    available: 1,
    cost: 10,
    who: ["shashank", "jack"],
  };
  return (
    <div className="flex flex-col justify-center items-center pt-24 ">
      <ListHeader />

      <List data={data} />
    </div>
  );
};
