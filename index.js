const express = require("express");
require("dotenv").config();
const app = express();
const http = require("http");
const server = http.createServer(app);
const socketio = require("socket.io");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");

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

// ── single DB connection for the whole app ──────────────────────────────────
mongoose
  .connect(process.env.DB)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.use(
  cors({
    origin: ["https://zodia.vercel.app", "http://localhost:3000"],
    credentials: true,
  })
);

const io = socketio(server, {
  cors: {
    origin: ["https://zodia.vercel.app", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ── REST routes ─────────────────────────────────────────────────────────────
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

// ── Socket.IO ────────────────────────────────────────────────────────────────
// Track userId → socketId so we can reach offline-joined rooms
const userSockets = {};

io.on("connection", (socket) => {
  // User joins their own "personal" room for notifications
  socket.on("join", ({ me, name }, cb) => {
    if (!me) return;
    socket.join(me);
    userSockets[me] = socket.id;
    if (typeof cb === "function") cb("joined");
  });

  // User joins a chat room
  socket.on("room", ({ id }, cb) => {
    if (!id) return;
    socket.join(id);
    if (typeof cb === "function") cb("connected");
  });

  // Incoming chat message
  socket.on("message", async ({ id, user, roomid, name, text }, cb) => {
    if (!id || !user || !roomid || !text) return;
    const time = Time();
    const userId = typeof user === "object" ? user._id : user;

    // Broadcast to everyone in the room (including sender tab)
    io.to(roomid).emit("Messages", { id, user: userId, roomid, name, text, time });

    // Persist & notify
    try {
      await msg_notification(id, userId, roomid, name, text);
    } catch (e) {
      console.error("msg_notification error:", e.message);
    }

    // Notify both participants via their personal rooms
    io.to(userId).emit("follower", { me: userId, you: id, name, text });
    io.to(id).emit("follower", { me: id, you: userId, name, text });

    if (typeof cb === "function") cb("done");
  });

  socket.on("unfollow", ({ me, you, name, text }, cb) => {
    unfollow(me, you, name, text);
    io.to(you).emit("follower", { me: you, you: me, name, text });
    io.to(me).emit("follower", { me, you, name, text });
    if (typeof cb === "function") cb("done");
  });

  socket.on("follow", ({ me, you, name }, cb) => {
    followers(me, you, name);
    io.to(you).emit("follower", { me: you, you: me, name, text: "following" });
    if (typeof cb === "function") cb("done");
  });

  socket.on("disconnect", () => {
    // Clean up userSockets map
    for (const [uid, sid] of Object.entries(userSockets)) {
      if (sid === socket.id) delete userSockets[uid];
    }
  });
});

// ── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

server.on("error", (error) => console.error("Server error:", error));
server.listen(8000, () => console.log("app listen in 8000"));
