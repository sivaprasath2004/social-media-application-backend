require("dotenv").config();
const mongoose = require("mongoose");
const follow = require("../mongodb/followingSchema");
const Time = require("./Time");
const chats = require("../mongodb/messageSchema");
mongoose.connect(process.env.DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const msg_notification = async (id, user, roomid, name, text) => {
  let time = Time();
  let users = await follow.findById(user);
  let search = users.RoomId.find((item) => item.id === id);
  if (search) {
  } else {
    users.RoomId.push({ id: id, roomId: roomid });
  }
  await chats.create({
    id: roomid,
    chats: [{ id: id, Text: text, url: name }],
  });
  users.notification.push({
    id: id,
    notify: "message",
    name: text,
    time: time,
  });
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
module.exports = { msg_notification, messagersfind };
