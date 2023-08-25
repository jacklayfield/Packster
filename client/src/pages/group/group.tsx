import Col from "react-bootstrap/esm/Col";
import Row from "react-bootstrap/esm/Row";
import { ListItem } from "../../components/listItem";

export const Group = () => {
  return (
    <div className="flex flex-col justify-center items-center pt-24 ">
      <div className="text-7xl pb-6">Example</div>

      <div className="w-75 rounded-2xl px-6 py-6 text-center">
        <Row>
          <Col>
            <h3>Item</h3>
          </Col>
          <Col>
            <h3>Required</h3>
          </Col>
          <Col>
            <h3>Available</h3>
          </Col>
          <Col>
            <h3>Cost</h3>
          </Col>
          <Col>
            <h3>Who</h3>
          </Col>
        </Row>
      </div>
      <ListItem />
      <ListItem />
      <ListItem />
    </div>
  );
};
