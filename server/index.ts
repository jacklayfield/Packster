import express from "express";
import cors from "cors";
import corsOptions from "./config/corsOptions";
import "./loadEnv";
import "express-async-errors";
import group from "./routes/group";
import item from "./routes/item";
import http from "http";
import { Server, Socket } from "socket.io";
import { connectToDatabase } from "./db/conn";
// import { instrument } from "@socket.io/admin-ui";
import { ClientToServerEvents, ServerToClientEvents } from "../typings";

const PORT = process.env.PORT || 7000;
const app = express();

connectToDatabase()
  .then(() => {
    console.log("DB successfully connected");
  })
  .catch((error: Error) => {
    console.error("Database connection failed", error);
  });

app.use(cors(corsOptions));
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
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// instrument(io, {
//   auth: false,
//   mode: "development",
// });

// io logic

io.on(
  "connection",
  (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    socket.on("clientMsg", (data) => {
      console.log(data);
      if (data.room === "") {
        io.sockets.emit("serverMsg", data);
      } else {
        socket.join(data.room);
        io.to(data.room).emit("serverMsg", data);
      }
    });
  }
);

// start the Express server
server.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
