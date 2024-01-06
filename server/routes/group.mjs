import express from "express";
import db from "../db/conn.mjs";
import groupModel from "./../models/group.mjs";
const router = express.Router();

// Post method for new group
router.post("/", async (req, res) => {
  try {
    let collection = await db.collection("group");
    // Validate the json
    if (groupModel.validate(req.body).error) {
      return res.status(400).send("Invalid request");
    }
    // Insert data
    let newDoc = req.body;
    let result = await collection.insertOne(newDoc);
    res.status(200).send(result);
  } catch (error) {
    res.status(500).json(error);
  }
});

export default router;
