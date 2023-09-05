import React from "react";
import Col from "react-bootstrap/esm/Col";
import Row from "react-bootstrap/esm/Row";

interface props {
  name: string;
  required: boolean;
  available: number;
  cost: number;
  assignees: string[];
}
export const ListItem= ( props: { name: string; required: boolean; available: number, cost: number; assignees: string[]; } ):JSX.Element => {
  return (
    
        <Row>
        <Col> {props.name} </Col>
        <Col>{JSON.stringify(props.required)}</Col>
        <Col>{props.available}</Col>
        <Col>{props.cost}</Col>
        <Col>
          {props.assignees}
          <button className="bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold py-1 px-2 ml-2 rounded">
            Claim!
          </button>
        </Col>
      </Row>
  );
};
