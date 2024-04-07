const mongoose = require("mongoose");
const chats = new mongoose.Schema({
  id: String,
  chats: [{ id: String, time: String, text: String, url: String }],
});
module.exports = mongoose.model("chats", chats);
