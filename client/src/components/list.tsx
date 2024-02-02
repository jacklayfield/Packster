import React from "react";
import { Item } from "../../../typings";
import { ListItem } from "./listItem";

interface LPROPS {
  items: Item[];
}
export const List: React.FC<LPROPS> = ({ items }) => {
  return (
    <>
      {items.map((item, i) => {
        return (
          <div className="mt-2" key={"item" + i}>
            <ListItem
              item={item}
              color={i % 2 ? "rgb(167 139 250)" : "rgb(196 181 253)"}
            />
          </div>
        );
      })}
    </>
  );
};
