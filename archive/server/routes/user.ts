import express from "express";
import { collections } from "../db/conn";
import userModel from "../models/user";
const router = express.Router();

// Post method for new user
router.post("/create", async (req, res) => {
  try {
    // Validate the json
    if (userModel.validate(req.body.data).error) {
      return res.status(400).send("Invalid user details");
    }
    // Insert data
    let newDoc = req.body.data;
    let result = await collections.user.insertOne(newDoc);
    res.status(200).send(result);
  } catch (error) {
    res.status(500).json(error);
  }
});

export default router;
