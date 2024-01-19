import Col from "react-bootstrap/esm/Col";
import Row from "react-bootstrap/esm/Row";
import ProgressBar from "./progressBar";

interface LHPROPS {
  data: { name: string; date: string; budget: number; budgetUsed: number };
}

export const ListHeader: React.FC<LHPROPS> = ({ data }) => {
  const date = new Date(data.date);
  return (
    <div className="w-75 mt-3 ">
      <Row className="flex items-center">
        <Col>
          <div className="bg-blue-200 rounded-md px-6 py-6 text-center text-3xl font-bold mt-30">
            {date.toLocaleDateString("en-us", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </div>{" "}
        </Col>
        <Col xs={6}>
          {" "}
          <div className="bg-gray-200 rounded-md px-9 py-9 text-center text-4xl font-bold mt-30">
            {data.name}
          </div>{" "}
        </Col>
        <Col>
          <ProgressBar
            bgcolor={"#BBF7D0"}
            completed={data.budgetUsed}
            total={data.budget}
          />
        </Col>
      </Row>
    </div>
  );
};
