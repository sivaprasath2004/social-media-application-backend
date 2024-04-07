require("dotenv").config();
const mongoose = require("mongoose");
const login_schema = require("../mongodb/loginschema");
const follow = require("../mongodb/followingSchema");
const Time = require("./Time");

mongoose.connect(process.env.DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const userId = async (req, res) => {
  try {
    let user = await follow.findById(req.body.id);
    res.status(200).send(user);
  } catch (err) {
    console.log(err);
  }
};
const login = async (req, res) => {
  try {
    let val = await login_schema.findOne({ Email_id: req.body.email });
    if (val) {
      if (val.pass === req.body.pass) {
        res.status(200).send({ res: "ok", user: val });
      } else {
        res.status(200).send({ res: "error", user: "Invalid Password" });
      }
    } else {
      res.status(200).send({ res: "error", user: "No more user found" });
    }
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
};
async function searchResult(req, res) {
  console.log(req.body);
  try {
    await mongoose.connect(process.env.DB);
    const regex = new RegExp(`.*${req.body.val}.*`, "i");
    let val = await follow.find({ name: regex });
    res.status(200).send(val);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}
const signup = async (req, res) => {
  try {
    if (req.body.name && req.body.username && req.body.email && req.body.pass) {
      let val = await login_schema.findOne({ Email_id: req.body.email });
      console.log(val);
      if (val) {
        res
          .status(200)
          .send({ res: "error", user: "Already used in mail Adress" });
      } else {
        let username = await login_schema.findOne({
          user_name: req.body.username,
        });
        if (username) {
          res
            .status(200)
            .send({ res: "error", user: "Already User Name taken" });
        } else {
          let user = await login_schema.create({
            name: req.body.name,
            user_name: req.body.username,
            Email_id: req.body.email,
            Des: req.body.Des,
            pass: req.body.pass,
          });
          await follow.create({
            _id: user._id,
            id: user._id,
            name: user.user_name,
            Des: user.Des,
          });
          res.status(200).send({ res: "ok", user: user });
        }
      }
    } else {
      res.status(200).send({ res: "error", user: "error" });
    }
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
};
const following = async (req, res) => {
  try {
    let user_followers = await follow.findById(req.body.id);
    let followers = "no";
    let followings = "no";
    if (req.body.section === "follow") {
      if (user_followers.following.length > 0) {
        followings = await follow.find({
          _id: { $in: user_followers.following },
        });
      }
      if (user_followers.followers.length > 0) {
        followers = await follow.find({
          _id: { $in: user_followers.followers },
        });
      }
      res.status(200).send({ followers: followers, followings: followings });
    } else {
      res.status(200).send(user_followers);
    }
  } catch (err) {
    console.log(err);
  }
};
const followers = async (me, you, name) => {
  try {
    let time = Time();
    console.log(me, you, name);
    let second = await follow.findById(you);
    let followers = second.followers.filter((item) => item !== me);
    let second_notification = second.notification;
    second_notification.push({
      id: me,
      notify: "followers",
      name: name,
      time: time,
    });
    second.notification = second_notification;
    followers.push(me);
    console.log(followers);
    second.followers = followers;
    second.notification_follow = true;
    let first = await follow.findById(me);
    let following = first.following.filter((item) => item !== you);
    let first_notification = first.notification;
    first_notification.push({
      id: following,
      notify: "following",
      name: second.name,
      time: time,
    });
    first.notification = first_notification;
    following.push(you);
    first.following = following;
    await first.save();
    await second.save();
  } catch (error) {
    console.log("Error connecting to MongoDB:", error);
  }
};
const unfollow = async (me, you, name, text) => {
  let following;
  let follower;
  let time = Time();
  if (text === "Unfollow") {
    following = me;
    follower = you;
  } else {
    following = you;
    follower = me;
  }
  let following_user = await follow.findById(following);
  let followings = following_user.following.filter((item) => item !== follower);
  let follower_user = await follow.findById(follower);
  let followers = follower_user.followers.filter((item) => item !== following);
  following_user.following = followings;
  let following_notification = following_user.notification;
  following_notification.push({
    id: follower,
    notify: "unfollow",
    name: follower_user.name,
    time: time,
  });
  following_user.notification = following_notification;
  follower_user.followers = followers;
  let follower_notification = follower_user.notification;
  follower_notification.push({
    id: following,
    notify: "remove",
    name: following_user.name,
    time: time,
  });
  follower_user.notification = follower_notification;
  await following_user.save();
  await follower_user.save();
};

const deleteNotification = async (req, res) => {
  let user = await follow.findById(req.body.id);
  console.log(req.body.item);
  let msg = user.notification.filter((ele) => ele.time !== req.body.item.time);
  user.notification = msg;
  console.log(msg);
  await user.save();
  res.status(200).send("ok");
};

const checkId = async (req, res) => {
  let re = await follow.findById(req.body.id);
  let room = re.RoomId.find((ele) => ele.id === req.body.user);
  console.log(room);
};
module.exports = {
  login,
  signup,
  searchResult,
  followers,
  following,
  unfollow,
  userId,
  deleteNotification,
  checkId,
};
