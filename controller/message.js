// No mongoose.connect() here — connection is owned by index.js
const follow = require("../mongodb/followingSchema");
const Time   = require("./Time");
const chats  = require("../mongodb/messageSchema");

const roomId_creater = async (req, res) => {
  try {
    const { id, user } = req.body;
    if (!id || !user) return res.status(400).send("Missing id or user");

    let userDoc = await follow.findById(id);
    if (!userDoc) return res.status(404).send("User not found");

    const existing = userDoc.RoomId?.find((item) => item.id === user);
    if (existing) {
      return res.status(200).send(userDoc);
    }

    const rooms = userDoc.RoomId || [];
    rooms.push({ id: user, roomId: id + user });
    userDoc.RoomId = rooms;
    await userDoc.save();

    // Also add room entry for the OTHER user so both sides know the roomId
    let otherDoc = await follow.findById(user);
    if (otherDoc) {
      const otherExisting = otherDoc.RoomId?.find((item) => item.id === id);
      if (!otherExisting) {
        const otherRooms = otherDoc.RoomId || [];
        otherRooms.push({ id: id, roomId: id + user });
        otherDoc.RoomId = otherRooms;
        await otherDoc.save();
      }
    }

    res.status(200).send(userDoc);
  } catch (error) {
    console.error("Error in roomId_creater:", error);
    res.status(500).send("Internal Server Error");
  }
};

const msg_notification = async (id, userId, roomid, name, text) => {
  const time = Time();

  // Save message to chat history
  let chatRoom = await chats.findOne({ id: roomid });
  if (chatRoom) {
    chatRoom.chats.push({ id, time, text, url: null });
    await chatRoom.save();
  } else {
    await chats.create({ id: roomid, chats: [{ id, time, text, url: null }] });
  }

  // Update RoomId order & notification for recipient
  const recipientDoc = await follow.findById(userId);
  if (recipientDoc) {
    // Move sender to top of RoomId list
    const filtered = recipientDoc.RoomId.filter((item) => item.id !== id);
    filtered.unshift({ id, roomId: roomid });
    recipientDoc.RoomId = filtered;
    recipientDoc.notification.push({ id, notify: "message", name: text, time });
    await recipientDoc.save();
  }

  // Update RoomId order for sender
  const senderDoc = await follow.findById(id);
  if (senderDoc) {
    const filtered = senderDoc.RoomId.filter((item) => item.id !== userId);
    filtered.unshift({ id: userId, roomId: roomid });
    senderDoc.RoomId = filtered;
    await senderDoc.save();
  }
};

const messagersfind = async (req, res) => {
  try {
    const ids = req.body.ids;
    if (!ids || !ids.length) return res.status(200).send([]);
    const result = await follow.find({ _id: { $in: ids } });
    const map = {};
    result.forEach((doc) => { map[doc._id.toString()] = doc; });
    const ordered = ids.map((id) => map[id]).filter(Boolean);
    res.status(200).send(ordered.reverse());
  } catch (err) {
    console.error("messagersfind error:", err);
    res.status(500).send("Internal Server Error");
  }
};

const chattings = async (req, res) => {
  try {
    const result = await chats.findOne({ id: req.body.id });
    res.json(result ? result : { chats: [] });
  } catch (err) {
    console.error("chattings error:", err);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = { msg_notification, roomId_creater, messagersfind, chattings };
