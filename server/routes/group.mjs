import express from "express";
import db from "../db/conn.mjs";
import groupModel from "./../models/group.mjs";
import { ObjectId } from "mongodb";
const router = express.Router();

// Post method for new group
router.post("/create", async (req, res) => {
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

// Get method for specified group
router.get("/id=:id", async (req, res) => {
  try {
    let collection = await db.collection("group");

    // Grab data
    let result = await collection.findOne({ _id: new ObjectId(req.params.id) });

    res.status(200).send(result);
  } catch (error) {
    res.status(500).json(error);
  }
});

export default router;
