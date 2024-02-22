import React, { useEffect, useRef, useState, MouseEvent } from "react";
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

  const containerRef = useRef<HTMLDivElement>(null);

  const handleDivClick = (
    index: number,
    item: Item,
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    e.stopPropagation();
    setItemData(item);
    setSelectedIdx(index);
  };

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setSelectedIdx(-1);
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  return (
    <div ref={containerRef}>
      {items.map((item, i) => {
        return (
          <div
            className="mt-2"
            key={"item" + i}
            onClick={(e) => handleDivClick(i, item, e)}
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
    </div>
  );
};
