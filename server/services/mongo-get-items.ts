import { Item } from "../../typings";
import { collections } from "../db/conn";

export const mongoGetItems = async (room: string) => {
  let results: Item[] = [];
  try {
    // Grab data
    let cursor = collections.item.find({
      groupId: room,
    });

    const res = await cursor.toArray();
  } catch (error) {
    console.error(`Error getting items from db for group ${room}`);
  }
  return results;
};
