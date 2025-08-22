import Col from "react-bootstrap/esm/Col";
import Row from "react-bootstrap/esm/Row";
import ProgressBar from "./progressBar";
import { BASE_URL_CLIENT } from "../App";
import { useNavigate } from "react-router-dom";

interface LHPROPS {
  data: { name: string; date: string; budget: number; grpId: string };
  budgetUsed: number;
}

export const GroupHeader: React.FC<LHPROPS> = ({ data, budgetUsed }) => {
  const date = new Date(data.date);
  const navigate = useNavigate();

  return (
    <div className="w-75">
      <Row className="flex items-center">
        <Col></Col>
        <Col xs={6} className="flex flex-col items-center">
          <div className="flex flex-row items-center">
            <div className="p-2 rounded-tl-lg rounded-bl-lg bg-violet-400 text-black text-md">
              Your Shareable Link:{" "}
            </div>
            <div className="p-2 rounded-tr-lg rounded-br-lg bg-violet-800 text-white font-semibold text-md">
              {BASE_URL_CLIENT + "/group/" + data.grpId}
            </div>
            <div></div>
          </div>
        </Col>
        <Col>
          <div className="float-right">
            <button
              onClick={() => navigate("/report/" + data.grpId)}
              className=" bg-gray-800 hover:bg-gray-800 text-white text-sm font-bold py-1 px-2 rounded"
            >
              <i className="fa-solid fa-file"></i> View Report
            </button>
            <button className=" bg-gray-800 hover:bg-gray-800 text-white text-sm font-bold py-1 px-2 mx-2 rounded">
              <i className="fa-solid fa-gear"></i> Admin{" "}
              <i className="fa-solid fa-caret-down"></i>
            </button>
          </div>
        </Col>
      </Row>
      <Row className="flex items-center mt-3">
        <Col>
          <div className="bg-blue-200 rounded-md px-3 py-3 text-center text-2xl font-bold mt-30">
            {date.toLocaleDateString("en-us", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </div>{" "}
        </Col>
        <Col xs={6}>
          {" "}
          <div className="bg-white rounded-md px-4 py-4 text-center text-4xl font-bold mt-30">
            {data.name}
          </div>{" "}
        </Col>
        <Col>
          <ProgressBar
            bgcolor={"#BBF7D0"}
            completed={budgetUsed}
            total={data.budget}
          />
        </Col>
      </Row>
    </div>
  );
};
