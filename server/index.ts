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
import { mongoGetItems } from "./services/mongo-get-items";
import { mongoSaveItem } from "./services/mongo-save-item";

const PORT = process.env.PORT || 7000;
const app = express();

/** --------------------------------------------------------------
############################ database ############################
--------------------------------------------------------------- */
connectToDatabase()
  .then(() => {
    console.log("DB successfully connected");
  })
  .catch((error: Error) => {
    console.error("Database connection failed", error);
  });

/** --------------------------------------------------------------
############################ express ############################
--------------------------------------------------------------- */
app.use(cors(corsOptions));
app.use(express.json());

// Load routes
app.use("/group", group);
app.use("/item", item);

// Global error handling
app.use((err, _req, res, next) => {
  res.status(500).send("Uh oh! An unexpected error occured.");
});

/** --------------------------------------------------------------
######################### http/io server #########################
--------------------------------------------------------------- */
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

/** --------------------------------------------------------------
########################## socket logic ##########################
--------------------------------------------------------------- */

let grpRoom = ""; // Grp ID
let allUsers = []; // All users in current room
io.on(
  "connection",
  (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    socket.on("clientMsg", (data) => {
      //console.log(data);
      if (data.room === "") {
        io.sockets.emit("serverMsg", data);
      } else {
        socket.join(data.room);
        io.to(data.room).emit("serverMsg", data);
      }
    });

    // ---------- JOIN ROOM EVENT ----------
    socket.on("join_room", (data) => {
      const { name, room } = data; // Data sent from client when join_room event emitted
      socket.join(room); // Join the user to a socket room

      let __createdtime__ = Date.now(); // Current timestamp
      // Send message to all users currently in the room, apart from the user that just joined

      // User color logic (Only picks "light" colors for themeing purposes)
      var Smletters = "01234567";
      var Lgletters = "89ABCDEF";
      var color = "#";
      for (var i = 0; i < 6; i++) {
        if (i % 2 == 0) {
          color += Lgletters[Math.floor(Math.random() * 8)];
        } else {
          color += Smletters[Math.floor(Math.random() * 8)];
        }
      }

      // Save the new user to the room
      grpRoom = room;
      allUsers.push({ id: socket.id, name, room, color: color });
      const users = allUsers.filter((user) => user.room === room);
      //console.log("users: ", users);
      socket.to(grpRoom).emit("room_users", { users });
      socket.emit("room_users", { users });
      //Get items for specific room and emit them to all users
      mongoGetItems(grpRoom)
        .then((items) => {
          console.log(items);
          socket.emit("send_items", { items });
        })
        .catch((error) => {
          console.error(error);
        });
    });

    // ---------- SEND ITEM EVENT ----------
    socket.on("send_item", (data) => {
      const { item, room } = data;
      grpRoom = room;
      // Send to all users in room, including sender
      io.in(room).emit("receive_item", { item });
      // Save to DB
      mongoSaveItem(item, room)
        .then((response) => console.log(response))
        .catch((err) => console.log(err));
    });

    // ---------- LEAVE ROOM EVENT ----------
    socket.on("leave_room", (data) => {
      const { name, room } = data;
      socket.leave(room);
      // Remove user from memory
    });

    // ---------- DISCONNECT ROOM EVENT ----------
    socket.on("disconnect", () => {
      // Remove user / send message
    });
  }
);

/** --------------------------------------------------------------
########################## start server ##########################
--------------------------------------------------------------- */
server.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
