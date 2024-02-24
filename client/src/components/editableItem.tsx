import React from "react";
import Col from "react-bootstrap/esm/Col";
import Row from "react-bootstrap/esm/Row";

import { Item } from "../../../typings";

interface LPROPS {
  item: Item;
  setItem: Function;
}

export const EditableItem: React.FC<LPROPS> = ({ item, setItem }) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setItem((prev: Item) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  return (
    <div className=" bg-indigo-300 rounded-md pl-3 pr-3 pt-3 pb-3 text-center text-xl mt-30 font-bold">
      <Row>
        <Col>
          {" "}
          <input
            className="bg-indigo-200 bg-opacity-50 w-full m-0 p-2  drop-shadow-lg text-lg text-center focus:shadow focus:outline-none"
            type="text"
            name="name"
            value={item.name}
            onChange={handleChange}
          ></input>{" "}
        </Col>
        <Col>
          <input
            className="bg-indigo-200 bg-opacity-50 w-full m-0 p-2  drop-shadow-lg text-lg text-center focus:shadow focus:outline-none"
            type="text"
            name="quantity"
            value={item.quantity}
            onChange={handleChange}
          ></input>{" "}
        </Col>
        <Col>
          <input
            className="bg-indigo-200 bg-opacity-50 w-full m-0 p-2 drop-shadow-lg text-lg text-center focus:shadow focus:outline-none"
            type="text"
            name="cost"
            value={item.cost}
            onChange={handleChange}
          ></input>{" "}
        </Col>
        <Col>
          <input
            className="bg-indigo-200 bg-opacity-50 w-full m-0 p-2  drop-shadow-lg text-lg text-center focus:shadow focus:outline-none"
            type="text"
            name="required"
            value={item.required ? "Yes" : "No"}
            onChange={handleChange}
          ></input>{" "}
        </Col>
        <Col>
          <input
            className="bg-indigo-200 bg-opacity-50 w-full m-0 p-2  drop-shadow-lg text-lg text-center focus:shadow focus:outline-none"
            type="text"
            name="usersBringing"
            value={item.usersBringing}
          ></input>{" "}
        </Col>
        <Col>
          <input
            className="bg-indigo-200 bg-opacity-50 w-full m-0 p-2  drop-shadow-lg text-lg text-center focus:shadow focus:outline-none"
            type="text"
            name="usersExempted"
            value={item.usersExempted}
            onChange={handleChange}
          ></input>{" "}
        </Col>
        <Col className="flex flex-row align-middle justify-center">
          <button className=" bg-green-200 w-half px-3 drop-shadow-lg text-sm text-center rounded-lg mr-3">
            <i className="fa-solid fa-check"></i>
          </button>{" "}
          <button className=" bg-red-300 w-half px-3 drop-shadow-lg text-sm text-center rounded-lg">
            <i className="fa-solid fa-trash-can"></i>
          </button>{" "}
        </Col>
      </Row>
    </div>
  );
};
