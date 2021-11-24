const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const path = require("path");
var env = require("dotenv/config");
var mongoose = require("mongoose");
var session = require("express-session");
var MongoStore = require("connect-mongo");
const http = require('http').createServer(app)

const port = process.env.PORT || 3000;

const static_path = path.join(__dirname, "../public");
const template_path = path.join(__dirname, "../templates/views");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static(static_path));
app.set("view engine", "ejs");
app.set("views", template_path);

mongoose.connect(
  process.env.MONGO_URL,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  (err) => {
    if (!err) {
      console.log("MongoDB Connection Succeeded.");
    } else {
      console.log("Error in DB connection : " + err);
    }
  }
);

var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {});

// creating 24 hours from milliseconds
const oneDay = 1000 * 60 * 60 * 24;
app.use(
  session({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    resave: true,
    saveUninitialized: false,
    cookie: { maxAge: oneDay },
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URL, //(URL FROM.env file)
    }),
  })
);

var index = require("./route.js");
app.use("/", index);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = res.send("Ooops!! Requested Pasge Not Found");
  err.status = 404;
  // next(err);
});

http.listen(port, () => {
  console.log(`Listening at port http://localhost:${port}/`);
});

// Socket 
const io = require('socket.io')(http)

io.on('connection', (socket) => {
    console.log('Connected...')
    socket.on('message', (msg) => {
        socket.broadcast.emit('message', msg)
    })

})