const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const Filter = require("bad-words");
const moment = require("moment");

const app = express();
// const router = express.Router()
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "../public");

app.use("/", express.static(publicDirectoryPath));

app.use((err, req, res, next) => {
  res.status(500).json({ message: err.message });
});

let rooms = {
  Mannheim: [],
  Heidelberg: [],
  Bochum: [],
  Dortmund: [],
};

io.on("connection", (socket) => {
  const regex = /\?.*/;

  const params = new URLSearchParams(
    socket.handshake.headers.referer.match(regex)[0]
  );
  const userParam = params.get("username");
  const roomParam = params.get("room");
  const colorParam = params.get("color");

  console.log(userParam + " joined room " + roomParam);

  rooms[roomParam].push({
    id: socket.id,
    name: userParam,
    color: colorParam,
  });

  socket.emit("welcome", "Welcome to the chat app!");

  socket.on("join", (username, room) => {
    socket.join(room);

    // sends it to all other users
    socket.broadcast
      .to(room)
      .emit("serverMessage", `${username} has joined!`, room, "darkmagenta");

    io.to(room).emit("userConnected", rooms[room]);
  });

  // User sends a message
  socket.on("userMessage", (msg, color, userName, callback) => {
    const filter = new Filter();

    if (filter.isProfane(msg)) {
      callback(true, "Inappropriate vocabulary");
      return;
    }

    console.log(userName + " sent a message in room " + roomParam);

    const now = moment();
    const time = now.format("HH:mm");
    const finalMsg = `${time} - ${userName}: ${msg}`;

    io.to(roomParam).emit("serverMessage", finalMsg, roomParam, color);
    callback(false, "Delivered!");
  });

  // User disconnects
  socket.on("disconnect", () => {
    console.log(userParam + " left room " + roomParam);

    rooms[roomParam] = rooms[roomParam].filter((user) => {
      return user.id !== socket.id;
    });

    io.to(roomParam).emit(
      "serverMessage",
      `${userParam} has left!`,
      roomParam,
      "darkred"
    );
    socket.broadcast.to(roomParam).emit("userConnected", rooms[roomParam]);
  });
});

app.get("/users/:room/:user", (req, res) => {
  const match = rooms[req.params.room].filter(
    (user) => user.name === req.params.user
  );
  if (match.length === 0) {
    res.send();
  } else {
    res.status(403).send();
  }
});

server.listen(port, () => {
  console.log("Starting server on port " + port + ".");
});
