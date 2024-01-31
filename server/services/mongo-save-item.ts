import { Item } from "../../typings";
import { collections } from "../db/conn";
import itemModel from "../models/item";

export const mongoSaveItem = async (item: Item, room: string) => {
  let results;
  try {
    if (itemModel.validate(item).error) {
      console.error(`Validation failed for item: ${item}`);
      return;
    }

    results = collections.item.insertOne(item);

    console.log(results);
  } catch (error) {
    console.error(`Error saving item to room: ${room}`);
  }
  return results;
};
