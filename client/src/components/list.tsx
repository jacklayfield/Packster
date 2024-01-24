import { useState } from "react";
import React from "react";
import Table from "react-bootstrap/Table";
import { ListItem2 } from "./listItemnew";
import { Item } from "../../../typings";
import { ListItem } from "./listItem";
import Col from "react-bootstrap/esm/Col";
import Row from "react-bootstrap/esm/Row";

interface LPROPS {
  items: Item[];
}
export const List: React.FC<LPROPS> = ({ items }) => {
  return (
    <div className="w-[80%]">
      <div className="mt-3 bg-gray-200 rounded-md pl-3 pr-3 pt-6 pb-6 text-center text-xl mt-30 font-bold">
        <Row>
          <Col> Name </Col>
          <Col>Quantity</Col>
          <Col>Cost per</Col>
          <Col>Required?</Col>
          <Col>Who's packing</Col>
          <Col>Will not use</Col>
          <Col>Click to claim</Col>
        </Row>
      </div>

      {items.map((item, i) => {
        return (
          <div className="mt-2" key={"item" + i}>
            <ListItem item={item} color={i % 2 ? "#D8B4FE" : "#E9D5FF"} />
          </div>
        );
      })}
    </div>
  );
};
