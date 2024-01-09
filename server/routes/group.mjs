import express from "express";
import db from "../db/conn.mjs";
import groupModel from "./../models/group.mjs";
const router = express.Router();

// Post method for new group
router.post("/create", async (req, res) => {
  console.log("made t", req.body.data);
  try {
    let collection = await db.collection("group");

    let newDoc = {
      name: req.body.data.name,
      date: req.body.data.date,
      budget: Number(req.body.data.budget),
      budgetUsed: 0,
    };

    // Validate the json
    if (groupModel.validate(newDoc).error) {
      return res.status(400).send("Invalid create group request");
    }

    // Insert data
    let result = await collection.insertOne(newDoc);
    res.status(200).send(result);
  } catch (error) {
    res.status(500).json(error);
  }
});

export default router;
