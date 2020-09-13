const socket = io();

socket.on("welcome", (msg) => {
  console.log(msg);
});

// Elements
const form = document.getElementById("input-form");
const input = document.getElementById("user-msg");
const chatBox = document.getElementById("chat-box");
const connectedUsers = document.getElementById("connected-users");
const roomLabel = document.getElementById("room");
const roomForm = document.getElementById("change-room");
const roomSelector = document.getElementById("room-selector");

input.focus();

const params = new URLSearchParams(window.location.search);
const userParam = params.get("username");
const roomParam = params.get("room");
const colorParam = params.get("color");

const autoscroll = () => {
  // New message element
  const $newMessage = chatBox.lastElementChild;

  // Height of the new message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  // Visible height
  const visibleHeight = chatBox.offsetHeight;

  // Height of messages container
  const containerHeight = chatBox.scrollHeight;

  // How far have I scrolled?
  const scrollOffset = chatBox.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    chatBox.scrollTop = chatBox.scrollHeight;
  }
};

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

socket.on("serverMessage", (msg, color) => {
  const newChatLine = document.createElement("p");
  const newContent = document.createTextNode(msg);
  newChatLine.setAttribute("style", `color: ${color};`);
  newChatLine.appendChild(newContent);

  chatBox.appendChild(newChatLine);
  autoscroll();
});

socket.on("loadHistory", (history) => {
  for (msgObj of history) {
    const finalMsg = `${msgObj.time} - ${msgObj.username}: ${msgObj.msg}`;

    const newChatLine = document.createElement("p");
    const newContent = document.createTextNode(finalMsg);
    newChatLine.setAttribute("style", `color: ${msgObj.color};`);
    newChatLine.appendChild(newContent);

    chatBox.appendChild(newChatLine);
    autoscroll();
  }
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
