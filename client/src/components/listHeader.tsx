import Col from "react-bootstrap/esm/Col";
import Row from "react-bootstrap/esm/Row";

export const ListHeader = () => {
  return (
    <div className="w-75 mt-3 ">
      <Row>
        <Col>
          <div className="bg-blue-200 rounded-md px-6 py-6 text-center text-3xl font-bold mt-30">
            11/20/2023
          </div>{" "}
        </Col>
        <Col xs={6}>
          {" "}
          <div className="bg-gray-200 rounded-md px-9 py-9 text-center text-4xl font-bold mt-30">
            Cool trip with a long name indeed
          </div>{" "}
        </Col>
        <Col>
          <div className="bg-green-200 rounded-md px-6 py-6 text-center text-3xl font-bold mt-30">
            $100/$250
          </div>
        </Col>
      </Row>
    </div>
  );
};
