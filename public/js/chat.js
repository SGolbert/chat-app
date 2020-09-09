const socket = io();

socket.on("welcome", (msg) => {
  console.log(msg);
});

const form = document.getElementById("input-form");
const input = document.getElementById("user-msg");
input.focus();
const roomLabel = document.getElementById("room");

const roomForm = document.getElementById("change-room");
const roomSelector = document.getElementById("room-selector");

const params = new URLSearchParams(window.location.search);
const userParam = params.get("username");
const roomParam = params.get("room");
const colorParam = params.get("color");

roomLabel.innerHTML = roomParam;

roomForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const url =
    "/chat.html?username=" +
    userParam +
    "&room=" +
    roomSelector.value +
    "&color=" +
    colorParam;

  window.location.href = url.replace(/[#]/, "%23");
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!input.value) return;
  const msg = input.value;
  const color = colorParam;

  socket.emit("userMessage", msg, color, userParam, (error, errorMsg) => {
    if (error) {
      console.error("Message NOT delivered! Reason:", errorMsg);
    }
  });
  form.reset();
  input.focus();
});

const chatBox = document.getElementById("chat-box");
const connectedUsers = document.getElementById("connected-users");

socket.on("serverMessage", (msg, room, color) => {
  const newChatLine = document.createElement("p");
  const newContent = document.createTextNode(msg);
  newChatLine.setAttribute("style", `color: ${color};`);
  newChatLine.appendChild(newContent);

  chatBox.appendChild(newChatLine);
});

socket.on("userConnected", (userArray) => {
  connectedUsers.innerHTML = "";

  for (user of userArray) {
    const newUser = document.createElement("p");
    const userName = document.createTextNode(user.name);
    newUser.setAttribute("style", `color: ${user.color};`);
    newUser.appendChild(userName);

    connectedUsers.appendChild(newUser);
  }
});

socket.emit("join", userParam, roomParam);
