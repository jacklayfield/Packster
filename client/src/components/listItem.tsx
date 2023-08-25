import Col from "react-bootstrap/esm/Col";
import Row from "react-bootstrap/esm/Row";

export const ListItem = () => {
  const ex = "Jack, Shashank";
  return (
    <div className="w-75 bg-violet-300 rounded-2xl px-6 py-6 text-center font-bold mt-3">
      <Row>
        <Col>Tent </Col>
        <Col>3</Col>
        <Col>1</Col>
        <Col>N/A</Col>
        <Col>
          {ex}
          <button className="bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold py-1 px-2 ml-2 rounded">
            Claim!
          </button>
        </Col>
      </Row>
    </div>
  );
};
