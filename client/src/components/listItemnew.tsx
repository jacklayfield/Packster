import React from "react";
import Table from "react-bootstrap/Table";

interface props {
  name: string;
  required: boolean;
  available: number;
  cost: number;
  assignees: string[];
}
export const ListItem2 = (props: {
  name: string;
  required: boolean;
  available: number;
  cost: number;
  assignees: string[];
}): JSX.Element => {
  return (
    <tr>
      <td> {props.name} </td>
      <td>{JSON.stringify(props.required)}</td>
      <td>{props.available}</td>
      <td>{props.cost}</td>
      <td>
        {props.assignees}
        <button className="bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold py-1 px-2 ml-2 rounded">
          Claim!
        </button>
      </td>
    </tr>
  );
};
