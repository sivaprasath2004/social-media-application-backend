const express = require("express");
require("dotenv").config();
const app = express();
const http = require("http");
const server = http.createServer(app);
const socketio = require("socket.io");
const bodyParser = require("body-parser");
const cors = require("cors");
const {
  msg_notification,
  messagersfind,
  roomId_creater,
  chattings,
} = require("./controller/message");
const {
  login,
  signup,
  searchResult,
  followers,
  following,
  unfollow,
  userId,
  deleteNotification,
  checkId,
} = require("./controller/user");
const Time = require("./controller/Time");
app.use(cors());
const io = socketio(server, { 
    cors: { 
        origin: "http://localhost:3000", // or specific origin
        methods: ["GET", "POST"] // specify the allowed methods
    } 
});
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

app.get("/", (req, res) => res.send("How Can I Help U..."));
app.post("/signup", signup);
app.post("/followings", following);
app.post("/searchResult", searchResult);
app.post("/login", login);
app.post("/userId", userId);
app.post("/deleteMessage", deleteNotification);
app.post("/room", roomId_creater);
app.post("/mys", checkId);
app.post("/messagers", messagersfind);
app.post("/chattings", chattings);
io.on("connect", (socket) => {
  socket.on("join", ({ me, name }, callBack) => {
    socket.join(me);
  });
  function unfollowed(me, you, name, text) {
    io.to(you).emit("follower", { me: you, you: me, name: name, text: text });
  }
  socket.on("room", ({ id }, callBack) => {
    socket.join(id);
    callBack("connected");
  });
  let count;
  socket.on("message", ({ id, user, roomid, name, text }, callBack) => {
    count = 1;
    let time = Time();
    if (count === 1) {
      io.to(roomid).emit("Messgaes", { id, user, roomid, name, text, time });
      count += 1;
    }
    msg_notification(id, user, roomid, name, text);
    unfollowed(id, user, roomid, text);
    unfollowed(user, id, roomid, text);
    callBack("done");
  });
  socket.on("unfollow", ({ me, you, name, text }, callBack) => {
    unfollow(me, you, name, text);
    unfollowed(me, you, name, text);
    callBack("done");
  });
  socket.on("follow", ({ me, you, name }, callBack) => {
    followers(me, you, name);
    unfollowed(me, you, name, "following");
    callBack("done");
  });
});
server.on("error", (error) => {
  console.error("Server error:", error);
});
server.listen(8000, () => console.log("app listen in 8000"));
