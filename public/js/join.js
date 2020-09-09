// const socket = io();

const form = document.querySelector("form");
const userName = document.getElementById("username");
const chatRoom = document.getElementById("room");
const customRoom = document.getElementById("custom-room");
const color = document.getElementById("color");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const room = customRoom.value === "" ? chatRoom.value : customRoom.value;

  const url = "/users/" + room + "/" + encodeURIComponent(userName.value);

  fetch(url).then((response) => {
    if (!response.ok) {
      alert("User name already in use!");
    } else {
      const url =
        "/chat.html?username=" +
        userName.value +
        "&room=" +
        room +
        "&color=" +
        color.value;

      window.location.href = url.replace(/[#]/, "%23");
    }
  });
});
