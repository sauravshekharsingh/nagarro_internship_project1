const socket = io();

async function loadMsgs() {
  let allMsgs = await axios.get("/allmessages");

  for (let msg of allMsgs.data) {
    $("#all-msg-container").append(
      `<li class='message'>
                <span class='msg-user'>@${msg.user}<span>
                <span class='msg-time'>${new Date(
                  msg.createdAt
                ).toLocaleString()} <span>
                <p class='msg-content'>${msg.content}</p>
            </li>`
    );
  }
}

loadMsgs();

$("#send-msg-btn").click(() => {
  const textMsg = $("#msg-text").val();

  if (textMsg === "") {
    return;
  }

  socket.emit("send-msg", {
    user: currentUser,
    msg: textMsg,
  });

  $("#msg-text").val("");
});

socket.on("recived-msg", (data) => {
  console.log("RECEIVED", data);

  $("#all-msg-container").append(
    `<li class='message'>
        <span class='msg-user'>@${data.user}<span>
        <span class='msg-time'>${new Date(
          data.createdAt
        ).toLocaleString()} <span>
        <p class='msg-content'>${data.msg}</p>
    </li>`
  );
});
