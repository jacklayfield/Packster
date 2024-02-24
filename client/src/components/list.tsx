import React, {
  useEffect,
  useRef,
  useState,
  MouseEvent,
  useCallback,
} from "react";
import {
  ClientToServerEvents,
  Item,
  ServerToClientEvents,
} from "../../../typings";
import { ListItem } from "./listItem";
import { EditableItem } from "./editableItem";
import * as io from "socket.io-client";

interface LPROPS {
  grpId: string;
  socket: io.Socket<ServerToClientEvents, ClientToServerEvents>;
  listItems: Item[];
  setListItems: React.Dispatch<React.SetStateAction<Item[]>>;
}

export const List: React.FC<LPROPS> = ({
  grpId,
  socket,
  listItems,
  setListItems,
}) => {
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

  const clientId = socket.id || "q";

  useEffect(() => {
    socket.on("receive_item", (data) => {
      const newItem: Item = {
        name: data.item.name,
        quantity: data.item.quantity,
        cost: data.item.cost,
        usersBringing: data.item.usersBringing,
        usersExempted: data.item.usersExempted,
        required: data.item.required,
        groupId: data.item.groupId,
      };

      setListItems((prevItems: Item[]) => {
        const updatedList = [...prevItems, newItem];

        if (clientId === data.clientId) {
          setItemData(item);
          setSelectedIdx(updatedList.length - 1);
        }

        return updatedList;
      });
    });

    // Remove event listener on component unmount
    return () => {
      socket.off("receive_item");
    };
  }, [socket, clientId, setListItems, setItemData, setSelectedIdx]);

  let item: Item = {
    name: "New Item",
    quantity: 0,
    cost: 0,
    usersBringing: [],
    usersExempted: [],
    required: false,
    groupId: grpId,
  };

  const handleAddClicked = () => {
    const room: string = grpId;
    socket.emit("send_item", { item, room, clientId });
  };

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
    <>
      {" "}
      <div
        className="mt-2 mb-2 text-gray-600 hover:text-gray-900 hover:border-gray-900 hover:bg-gray-300 hover:cursor-pointer border-3 border-dotted border-gray-600 rounded-md px-3 py-3 text-center text-lg"
        onClick={handleAddClicked}
      >
        <span className="fa-solid fa-circle-plus fa-xl"></span> Add an item
      </div>
      <div ref={containerRef}>
        {listItems.map((item, i) => {
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
    </>
  );
};
