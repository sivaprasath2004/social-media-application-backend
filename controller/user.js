// No mongoose.connect() here — connection is owned by index.js
const login_schema = require("../mongodb/loginschema");
const follow       = require("../mongodb/followingSchema");
const Time         = require("./Time");

const userId = async (req, res) => {
  try {
    const user = await follow.findById(req.body.id);
    if (!user) return res.status(404).send("User not found");
    res.status(200).send(user);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

const login = async (req, res) => {
  try {
    const val = await login_schema.findOne({ Email_id: req.body.email });
    if (!val) return res.status(200).send({ res: "error", user: "No user found" });
    if (val.pass !== req.body.pass)
      return res.status(200).send({ res: "error", user: "Invalid Password" });
    res.status(200).send({ res: "ok", user: val });
  } catch (error) {
    console.error("login error:", error);
    res.status(500).send("Internal Server Error");
  }
};

const searchResult = async (req, res) => {
  try {
    const regex = new RegExp(`.*${req.body.val}.*`, "i");
    const val = await follow.find({ name: regex });
    res.status(200).send(val);
  } catch (error) {
    console.error("searchResult error:", error);
    res.status(500).send("Internal Server Error");
  }
};

const signup = async (req, res) => {
  try {
    const { name, username, email, pass, Des } = req.body;
    if (!name || !username || !email || !pass)
      return res.status(200).send({ res: "error", user: "Fill all fields" });

    const emailExists = await login_schema.findOne({ Email_id: email });
    if (emailExists)
      return res.status(200).send({ res: "error", user: "Email already used" });

    const userExists = await login_schema.findOne({ user_name: username });
    if (userExists)
      return res.status(200).send({ res: "error", user: "Username already taken" });

    const user = await login_schema.create({ name, user_name: username, Email_id: email, Des, pass });
    await follow.create({ _id: user._id, id: user._id, name: user.user_name, Des: user.Des });
    res.status(200).send({ res: "ok", user });
  } catch (error) {
    console.error("signup error:", error);
    res.status(500).send("Internal Server Error");
  }
};

const following = async (req, res) => {
  try {
    const user_followers = await follow.findById(req.body.id);
    if (!user_followers) return res.status(404).send("User not found");

    if (req.body.section === "follow") {
      const followings = user_followers?.following?.length
        ? await follow.find({ _id: { $in: user_followers.following } })
        : "no";
      const followers = user_followers?.followers?.length
        ? await follow.find({ _id: { $in: user_followers.followers } })
        : "no";
      return res.status(200).send({ followers, followings });
    }
    res.status(200).send(user_followers);
  } catch (err) {
    console.error("following error:", err);
    res.status(500).send("Internal Server Error");
  }
};

const followers = async (me, you, name) => {
  try {
    const time = Time();
    const second = await follow.findById(you);
    if (!second) return;
    second.followers = [...second.followers.filter((i) => i !== me), me];
    second.notification.push({ id: me, notify: "followers", name, time });
    second.notification_follow = true;

    const first = await follow.findById(me);
    if (!first) return;
    first.following = [...first.following.filter((i) => i !== you), you];
    first.notification.push({ id: you, notify: "following", name: second.name, time });

    await first.save();
    await second.save();
  } catch (error) {
    console.error("followers error:", error);
  }
};

const unfollow = async (me, you, name, text) => {
  try {
    const following_id = text === "Unfollow" ? me : you;
    const follower_id  = text === "Unfollow" ? you : me;
    const time = Time();

    const followingUser = await follow.findById(following_id);
    const followerUser  = await follow.findById(follower_id);
    if (!followingUser || !followerUser) return;

    followingUser.following = followingUser.following.filter((i) => i !== follower_id);
    followingUser.notification.push({ id: follower_id, notify: "unfollow", name: followerUser.name, time });

    followerUser.followers = followerUser.followers.filter((i) => i !== following_id);
    followerUser.notification.push({ id: following_id, notify: "remove", name: followingUser.name, time });

    await followingUser.save();
    await followerUser.save();
  } catch (err) {
    console.error("unfollow error:", err);
  }
};

const deleteNotification = async (req, res) => {
  try {
    const user = await follow.findById(req.body.id);
    if (!user) return res.status(404).send("User not found");
    user.notification = user.notification.filter(
      (ele) => !(ele.id === req.body.item.id && ele.notify === req.body.item.notify)
    );
    await user.save();
    res.status(200).send("ok");
  } catch (err) {
    console.error("deleteNotification error:", err);
    res.status(500).send("Internal Server Error");
  }
};

const checkId = async (req, res) => {
  try {
    const re   = await follow.findById(req.body.id);
    const room = re?.RoomId?.find((ele) => ele.id === req.body.user);
    res.status(200).send(room || null);
  } catch (err) {
    console.error("checkId error:", err);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  login, signup, searchResult, followers,
  following, unfollow, userId, deleteNotification, checkId,
};
