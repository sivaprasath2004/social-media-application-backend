require("dotenv").config();
const mongoose = require("mongoose");
const follow = require("../mongodb/followingSchema");
const Time = require("./Time");
const chats = require("../mongodb/messageSchema");
mongoose.connect(process.env.DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const roomId_creater = async (req, res) => {
  try {
    let user = await follow.findById(req.body.id);
    let search = user.RoomId.find((item) => item.id === req.body.user);
    if (search) {
      res.status(200).send(user);
    } else {
      user.RoomId.push({
        id: req.body.user,
        roomId: req.body.id + req.body.user,
      });
      await user.save();
      res.status(200).send(user);
    }
  } catch (error) {
    console.error("Error in roomId function:", error);
    res.status(500).send("Internal Server Error");
  }
};
const msg_notification = async (id, user, roomid, name, text) => {
  let time = Time();
  let users = await follow.findById(user);
  let search = users.RoomId.filter((item) => item.id !== id);
  search.push({ id: id, roomId: roomid });
  users.RoomId = search;
  let me = await follow.findById(id);
  let me_search = me.RoomId.filter((item) => item.id !== user._id);
  me_search.push({ id: user, roomId: roomid });
  me.RoomId = me_search;
  users.notification.push({
    id: user._id,
    notify: "message",
    name: text,
    time: time,
  });
  let chatting_room = await chats.findOne({ id: roomid });
  if (chatting_room !== null) {
    chatting_room.chats.push({ id: id, time: time, text: text, url: null });
    await chatting_room.save();
  } else {
    await chats.create({
      id: roomid,
      chats: [{ id: id, time: time, text: text, url: null }],
    });
  }
  await me.save();
  await users.save();
};
const messagersfind = async (req, res) => {
  let ids = req.body.ids;
  let result = await follow.find({
    _id: { $in: req.body.ids },
  });
  let idToDocumentMap = {};
  result.forEach((doc) => {
    idToDocumentMap[doc._id.toString()] = doc;
  });
  let orderedResult = ids.map((id) => idToDocumentMap[id]);
  res.status(200).send(orderedResult.reverse());
};
const chattings = async (req, res) => {
  let result = await chats.findOne({ id: req.body.id });
  if (result) {
    res.json(result);
  } else {
    res.json({ chats: undefined });
  }
};
module.exports = { msg_notification, roomId_creater, messagersfind, chattings };
