/////// app.js

const express = require("express");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
require("dotenv").config();
const bcrypt = require("bcryptjs");
const LocalStrategy = require("passport-local").Strategy;
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const mongoDb = `mongodb+srv://${process.env.username}:${process.env.password}@cluster0.fy2x0qq.mongodb.net/?retryWrites=true&w=majority`;
mongoose.connect(mongoDb, { useUnifiedTopology: true, useNewUrlParser: true });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "mongo connection error"));

const User = mongoose.model(
  "User",
  new Schema({
    username: { type: String, required: true },
    password: { type: String, required: true }
  })
);

const app = express();
app.set("views", __dirname);
app.set("view engine", "ejs");

/*
passport.use(
  new LocalStrategy((username, password, done) => {
    User.findOne({ username:username })
    .then(user => {
      if (!user) {
        return done (null, false, { message: "Incorrect username" });
      }
      if (user.password !== password) {
        return done (null, false, { message: "Incorrect password" });
      }
      return done(null, user);
    })
    .catch(err => {
      return done (err);
    })
  })
)
*/
passport.use( 
  new LocalStrategy( async (username, password, done) => {
    try {
      const user = await User.findOne({ username:username })
      if (!user) {
        return done (null, false, { message: "Incorrect username" });
      }
      if (user.password !== password) {
        return done (null, false, { message: "Incorrect password" });
      }
      return done(null, user);
    } catch (err) {
      return done (err); 
    }
  })
)

passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    cb(null, { id: user.id, username: user.username });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

app.use(session({ secret: "cats", resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));

app.use(function(req, res, next) {
  res.locals.currentUser = req.user;
  next();
});

app.get("/", (req, res) => {
  res.render("index", { user: req.user });
});

app.get("/sign-up", (req, res) => res.render("sign-up-form"));
app.get("/log-out", (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  })
});
app.post("/sign-up", (req, res, next) => {
  bcrypt.hash(req.body.password, 10, async (err, hashedPW) => {
    if (err) {
      return next(err);
    }
    const user = new User({
      username: req.body.username,
      password: hashedPW
    });
    try {
      const result = await user.save();
      console.log(result);
      res.redirect("/");
    } catch (err) {
      console.error("Sum ting wong");
      handleError(err);
    };
  })
});
app.post(
  "/log-in",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/"
  })
)

app.listen(3000, () => console.log("app listening on port 3000!"));