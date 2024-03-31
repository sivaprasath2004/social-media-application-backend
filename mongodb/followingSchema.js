const mongoose = require("mongoose");
const followers = new mongoose.Schema({
  following: [String],
  followers: [String],
  notification: [
    {
      id: String,
      notify: String,
      name: String,
      time: String,
    },
  ],
  RoomId: [
    {
      id: String,
      roomId: String,
    },
  ],
  id: String,
  name: String,
  url: String,
  Des: String,
});
module.exports = mongoose.model("followers", followers);
