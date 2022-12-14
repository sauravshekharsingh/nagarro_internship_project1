const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user");
const flash = require("connect-flash");
require("dotenv").config();
const { isLoggedIn } = require("./middleware");

// Chat functionality
const http = require("http");
const server = http.createServer(app);
const socketio = require("socket.io");
const io = socketio(server);
const Chat = require("./models/chat");

// Database
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("Connected to the database");
  })
  .catch((err) => {
    console.log(err);
  });

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

// Static files
app.use(express.static(path.join(__dirname, "/public")));

// Parse formdata
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profileRoutes");
const chatRoutes = require("./routes/chatRoute");

// APIs
const postApiRoute = require("./routes/api/posts");
const { accessSync } = require("fs");

// Express session
app.use(
  session({
    secret: process.env.EXPRESS_SESSION_SECRET,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URL }),
    resave: false,
    saveUninitialized: true,
  })
);

// Flash messages
app.use(flash());

// Passport authentication
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Middlewares for success and error messages
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currentUser = req.user;
  next();
});

app.get("/", isLoggedIn, (req, res) => {
  res.render("home");
});

// Routes
app.use(authRoutes);
app.use(profileRoutes);
app.use(chatRoutes);

// APIs
app.use(postApiRoute);

// Socket connection
io.on("connection", (socket) => {
  console.log("connection established");

  socket.on("send-msg", async (data) => {
    io.emit("recived-msg", {
      msg: data.msg,
      user: data.user,
      createdAt: new Date(),
    });
    await Chat.create({ content: data.msg, user: data.user });
  });
});

// Server
server.listen(process.env.PORT, () => {
  console.log("Server running at port", process.env.PORT);
  console.log("Go to http://localhost:8000/");
});
