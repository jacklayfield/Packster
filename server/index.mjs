import express from "express";
import cors from "cors";
import "./loadEnv.mjs";
import "express-async-errors";
import "./db/conn.mjs";
import group from "./routes/group.mjs";
import item from "./routes/item.mjs";
import http from "http";
import { Server } from "socket.io";

const PORT = process.env.PORT || 7000;
const app = express();

app.use(cors());
app.use(express.json());

// Load routes
app.use("/group", group);
app.use("/item", item);

// Global error handling
app.use((err, _req, res, next) => {
  res.status(500).send("Uh oh! An unexpected error occured.");
});

//create an http server using express app
const server = http.createServer(app);

// create io server
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// io logic
io.on("connection", (socket) => {
  socket.emit("connect", { message: "a new client connected" });
});

// start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
