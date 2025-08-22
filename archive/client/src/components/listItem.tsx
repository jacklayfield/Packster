import React from "react";
import Col from "react-bootstrap/esm/Col";
import Row from "react-bootstrap/esm/Row";

import { Item } from "../../../../typings";

interface LPROPS {
  item: Item;
  color: string;
}

export const ListItem: React.FC<LPROPS> = ({ item, color }) => {
  return (
    <div
      className="rounded-md px-3 py-3 text-center text-lg"
      style={{ backgroundColor: color }}
    >
      <Row>
        <Col> {item.name} </Col>
        <Col>{item.quantity}</Col>
        <Col>{item.cost}</Col>
        <Col>{item.required ? "Yes" : "No"}</Col>
        <Col>{item.usersBringing.join(", ")}</Col>
        <Col>{item.usersExempted.join(", ")}</Col>
        <Col>
          <button className="bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold py-1 px-2 ml-2 rounded">
            Claim!
          </button>
        </Col>
      </Row>
    </div>
  );
};
