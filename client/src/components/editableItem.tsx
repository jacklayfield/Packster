import React from "react";
import Col from "react-bootstrap/esm/Col";
import Row from "react-bootstrap/esm/Row";

import { Item } from "../../../typings";

interface LPROPS {
  item: Item;
}

export const EditableItem: React.FC<LPROPS> = ({ item }) => {
  return (
    <div className=" bg-purple-800 rounded-md pl-3 pr-3 pt-3 pb-3 text-center text-xl mt-30 font-bold">
      <Row>
        <Col>
          {" "}
          <input
            className="bg-purple-200 w-full m-0 p-2 bg-gray-200 drop-shadow-lg text-lg text-center rounded-3xl focus:shadow focus:outline-none"
            type="text"
            name="name"
            value={item.name}
          ></input>{" "}
        </Col>
        <Col>
          <input
            className="w-full  p-2 bg-gray-200 drop-shadow-lg text-lg text-center rounded-3xl focus:shadow focus:outline-none"
            type="text"
            name="name"
            value={item.quantity}
          ></input>{" "}
        </Col>
        <Col>
          <input
            className="bg-purple-200 w-full  p-2 bg-gray-200 drop-shadow-lg text-lg text-center rounded-3xl focus:shadow focus:outline-none"
            type="text"
            name="name"
            value={item.cost}
          ></input>{" "}
        </Col>
        <Col>
          <input
            className=" w-full p-2 bg-gray-200 drop-shadow-lg text-lg text-center rounded-3xl focus:shadow focus:outline-none"
            type="text"
            name="name"
            value={item.required ? "Yes" : "No"}
          ></input>{" "}
        </Col>
        <Col>
          <input
            className="bg-purple-200 w-full p-2 bg-gray-200 drop-shadow-lg text-lg text-center rounded-3xl focus:shadow focus:outline-none"
            type="text"
            name="name"
            value={item.usersBringing.join(", ")}
          ></input>{" "}
        </Col>
        <Col>
          <input
            className="w-full p-2 bg-gray-200 drop-shadow-lg text-lg text-center rounded-3xl focus:shadow focus:outline-none"
            type="text"
            name="name"
            value={item.usersExempted.join(", ")}
          ></input>{" "}
        </Col>
        <Col>
          <button className="bg-purple-200 w-full p-2 bg-gray-200 drop-shadow-lg text-lg text-center rounded-3xl focus:shadow focus:outline-none">
            Claim
          </button>{" "}
        </Col>
      </Row>
    </div>
  );
};
