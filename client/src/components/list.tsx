import React, { useState } from "react";
import { Item } from "../../../typings";
import { ListItem } from "./listItem";
import { EditableItem } from "./editableItem";

interface LPROPS {
  items: Item[];
}
export const List: React.FC<LPROPS> = ({ items }) => {
  const [selectedIdx, setSelectedIdx] = useState<number>();
  const [itemData, setItemData] = useState<Item>({
    name: "",
    quantity: 0,
    cost: 0,
    usersBringing: [],
    usersExempted: [],
    required: false,
    groupId: "",
  });

  const handleDivClick = (index: number, item: Item) => {
    setItemData(item);
    setSelectedIdx(index);
  };

  return (
    <>
      {items.map((item, i) => {
        return (
          <div
            className="mt-2"
            key={"item" + i}
            onClick={() => handleDivClick(i, item)}
          >
            {selectedIdx === i ? (
              <EditableItem item={itemData} setItem={setItemData} />
            ) : (
              <ListItem
                item={item}
                color={i % 2 ? "rgb(167 139 250)" : "rgb(196 181 253)"}
              />
            )}
          </div>
        );
      })}
    </>
  );
};
