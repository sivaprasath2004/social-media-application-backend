const mongoose = require("mongoose");
const chats = new mongoose.Schema({
  id: String,
  chats: [{ id: String, Text: String, url: String }],
});
module.exports = mongoose.model("chats", chats);
