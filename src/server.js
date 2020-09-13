const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const Filter = require("bad-words");
const moment = require("moment");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "../public");

app.use("/", express.static(publicDirectoryPath));

app.use((err, req, res, next) => {
  res.status(500).json({ message: err.message });
});

let rooms = {
  Mannheim: {
    users: [],
    msgHistory: [],
  },
  Heidelberg: {
    users: [],
    msgHistory: [],
  },
  Bochum: {
    users: [],
    msgHistory: [],
  },
  Dortmund: {
    users: [],
    msgHistory: [],
  },
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

  rooms[roomParam].users.push({
    id: socket.id,
    name: userParam,
    color: colorParam,
  });

  socket.emit("welcome", "Welcome to the chat app!");

  const historyStart = Math.max(rooms[roomParam].msgHistory.length - 50 - 1, 0);
  socket.emit(
    "loadHistory",
    rooms[roomParam].msgHistory.slice(historyStart, historyStart + 50)
  );

  socket.on("join", (username, room) => {
    socket.join(room);

    // sends it to all other users
    socket.broadcast
      .to(room)
      .emit("serverMessage", `${username} has joined!`, room, "darkmagenta");

    io.to(room).emit("userConnected", rooms[room].users);
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

    rooms[roomParam].msgHistory.push({
      time,
      msg,
      username: userName,
      color: colorParam,
    });

    io.to(roomParam).emit("serverMessage", finalMsg, color);
    callback(false, "Delivered!");
  });

  // User disconnects
  socket.on("disconnect", () => {
    console.log(userParam + " left room " + roomParam);

    rooms[roomParam].users = rooms[roomParam].users.filter((user) => {
      return user.id !== socket.id;
    });

    io.to(roomParam).emit(
      "serverMessage",
      `${userParam} has left!`,
      roomParam,
      "darkred"
    );
    socket.broadcast
      .to(roomParam)
      .emit("userConnected", rooms[roomParam].users);
  });
});

app.get("/users/:room/:user", (req, res) => {
  const room = req.params.room;
  const user = req.params.user;

  if (!Object.keys(rooms).includes(room)) {
    rooms[room] = {
      users: [],
      msgHistory: [],
    };
    res.send();
  }

  const match = rooms[room].users.filter(
    (userEntry) => userEntry.name === user
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
