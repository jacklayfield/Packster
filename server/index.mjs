import express from "express";
import cors from "cors";
import "./loadEnv.mjs";
import "express-async-errors";
import test from "./routes/test.mjs";

console.log("MONGOURL", process.env.MONGO_URL);

const PORT = process.env.PORT || 7000;
const app = express();

app.use(cors());
app.use(express.json());

// Load the /test routes
app.use("/test", test);

// Global error handling
app.use((err, _req, res, next) => {
  res.status(500).send("Uh oh! An unexpected error occured.");
});

// start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
