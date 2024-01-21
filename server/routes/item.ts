import express from "express";
import { collections } from "../db/conn";
import itemModel from "../models/item";
const router = express.Router();

// Post method for new item
router.post("/create", async (req, res) => {
  try {
    // Validate the json
    if (itemModel.validate(req.body.data).error) {
      return res.status(400).send("Invalid request");
    }
    // Insert data
    let newDoc = req.body.data;
    let result = await collections.item.insertOne(newDoc);
    res.status(200).send(result);
  } catch (error) {
    res.status(500).json(error);
  }
});

export default router;
