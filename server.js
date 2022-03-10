const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

/* MONGO OPERATIONS*/
const DB_URI = process.env.DB_URI;
mongoose.connect(DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const Schema = mongoose.Schema;

const exerciseSchema = new Schema({
  username: String,
  description: String,
  duration: Number,
  date: {
    type: Date,
    default: Date.now,
  },
});
const Exercise = mongoose.model("Exercise", exerciseSchema);

const userSchema = new Schema({
  username: String,
});
const User = mongoose.model("User", userSchema);

/* END MONGO OPERATIONS*/

/* API OPERATIONS */

// Add user
app.post("/api/users", async function (req, res) {
  const userName = req.body.username;
  var user = await User.findOne({ username: userName });
  if (user) {
    res.json({ username: user.username, _id: user._id });
    return;
  }

  user = new User({
    username: userName,
  });
  const u = await user.save();
  res.json({ username: u.username, _id: u._id });
});

// Add exercise
app.post("/api/users/:_id/exercises", async function (req, res) {
  const id = req.params._id;
  var { description, duration, date } = req.body;

  var user = await User.findById(id);
  if (!user) {
    return res.json({ status: 400, message: "Unknown userId" });
  }

  var exercise = new Exercise({
    username: user.username,
    description,
    duration,
    date,
  });
  const ex = await exercise.save();

  let result = {
    username: user.username,
    description: ex.description,
    duration: ex.duration,
    date: ex.date.toDateString(),
    _id: user._id,
  };

  res.json(result);
});

// Get Users
app.get("/api/users", async function (req, res) {
  let users = await User.find({});
  let usersArry = users.map((m) => ({ username: m.username, _id: m._id }));
  res.json(usersArry);
});

// Get User Logs
app.get("/api/users/:_id/logs", async function (req, res) {
  const id = req.params._id;
  //?[from][&to][&limit]
  let user = await User.findById(id);
  if (!user) {
    return res.json({ status: 400, message: "Unknown userId" });
  }

  let exercises = await Exercise.find({ username: user.username })
    //date:{$gte: req.query.from, $lte: req.query.to}
    // date: {
    //      $lte: hasTo ? to.toISOString() : Date.now(),
    //      $gte: hasFrom ? from.toISOString() : 0
    //    }
    .limit(+req.query.limit);

  let logStr = exercises.map((m) => ({
    description: m.description,
    duration: m.duration,
    date: m.date.toDateString(),
  }));
  let result = {
    username: user.username,
    count: exercises.length,
    _id: user._id,
    log: logStr,
  };

  res.json(result);
});

/* API OPERATIONS */

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
