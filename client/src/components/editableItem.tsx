import React from "react";
import Col from "react-bootstrap/esm/Col";
import Row from "react-bootstrap/esm/Row";

// import { Item } from "../../../typings";

interface LPROPS {
  item: {
    name: string;
    quantity: number;
    cost: number;
    usersBringing: string;
    usersExempted: string;
    required: string;
  };
  setItem: Function;
}

export const EditableItem: React.FC<LPROPS> = ({ item, setItem }) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setItem((prev: LPROPS["item"]) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

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
            onChange={handleChange}
          ></input>{" "}
        </Col>
        <Col>
          <input
            className="w-full  p-2 bg-gray-200 drop-shadow-lg text-lg text-center rounded-3xl focus:shadow focus:outline-none"
            type="text"
            name="quantity"
            value={item.quantity}
            onChange={handleChange}
          ></input>{" "}
        </Col>
        <Col>
          <input
            className="bg-purple-200 w-full  p-2 bg-gray-200 drop-shadow-lg text-lg text-center rounded-3xl focus:shadow focus:outline-none"
            type="text"
            name="cost"
            value={item.cost}
            onChange={handleChange}
          ></input>{" "}
        </Col>
        <Col>
          <input
            className=" w-full p-2 bg-gray-200 drop-shadow-lg text-lg text-center rounded-3xl focus:shadow focus:outline-none"
            type="text"
            name="required"
            value={item.required ? "Yes" : "No"}
            onChange={handleChange}
          ></input>{" "}
        </Col>
        <Col>
          <input
            className="bg-purple-200 w-full p-2 bg-gray-200 drop-shadow-lg text-lg text-center rounded-3xl focus:shadow focus:outline-none"
            type="text"
            name="usersBringing"
            value={item.usersBringing}
          ></input>{" "}
        </Col>
        <Col>
          <input
            className="w-full p-2 bg-gray-200 drop-shadow-lg text-lg text-center rounded-3xl focus:shadow focus:outline-none"
            type="text"
            name="usersExempted"
            value={item.usersExempted}
            onChange={handleChange}
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
