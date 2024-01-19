import express from "express";
import { ObjectId } from "mongodb";
import { collections } from "../db/conn";
import groupModel from "../models/group";
const router = express.Router();

// Post method for new group
router.post("/create", async (req, res) => {
  try {
    let newDoc = {
      name: req.body.data.name,
      date: req.body.data.date,
      budget: Number(req.body.data.budget),
      budgetUsed: 0,
    };

    console.log(newDoc);

    // Validate the json
    if (groupModel.validate(newDoc).error) {
      return res.status(400).send("Invalid create group request");
    }

    // Insert data
    console.log("here");
    let result = await collections.group.insertOne(newDoc);

    console.log("here2");
    res.status(200).send(result);
  } catch (error) {
    res.status(500).json(error);
  }
});

// Get method for specified group
router.get("/id=:id", async (req, res) => {
  try {
    // Grab data
    let result = await collections.group.findOne({
      _id: new ObjectId(req.params.id),
    });

    res.status(200).send(result);
  } catch (error) {
    res.status(500).json(error);
  }
});

export default router;
