const express = require("express");
require("dotenv").config();
const app = express();
const http = require("http");
const server = http.createServer(app);
const socketio = require("socket.io");
const io = socketio(server, { cors: { origin: "*" } });
const bodyParser = require("body-parser");
const cors = require("cors");
const { msg_notification, messagersfind } = require("./controller/message");
const {
  login,
  signup,
  searchResult,
  followers,
  following,
  unfollow,
  userId,
  deleteNotification,
  roomId_creater,
  checkId,
} = require("./controller/user");
const Time = require("./controller/Time");
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
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
io.on("connect", (socket) => {
  socket.on("join", ({ me, name }, callBack) => {
    socket.join(me);
    callBack("connected");
  });
  function unfollowed(me, you, name, text) {
    io.to(you).emit("follower", { me: you, you: me, name: name, text: text });
    console.log("commed");
  }
  socket.on("room", ({ id, user }, callBack) => {
    socket.join(id.roomId);
    callBack("connected");
  });
  socket.on("message", ({ id, user, roomid, name, text }, callBack) => {
    let time = Time();
    msg_notification(id, user, roomid, name, text);
    unfollowed(id, user, roomid, text);
    io.to(roomid).emit("Messgaes", { id, user, roomid, name, text, time });
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
server.listen(5000, () => console.log("app listen in 5000"));
