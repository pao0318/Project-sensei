const express = require("express");
const app = express();
const path = require("path");
const fs = require("fs");
var multer = require("multer");
const axios = require("axios");

require("dotenv/config");
require("./db/conn");

const RegisterSchema = require("./models/registers");
const SessionSchema = require("./models/sessions");

const port = process.env.PORT || 3000;

const static_path = path.join(__dirname, "../public");
const template_path = path.join(__dirname, "../templates/views");
//const partials_path=path.join(__dirname,"../templates/partials");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static(static_path));
app.set("view engine", "ejs");
app.set("views", template_path);

let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    cb(null, "Photo" + "_" + Date.now() + path.extname(file.originalname));
  },
});
var upload = multer({ storage: storage });

app.get("/", (req, res) => {
  res.render("index");
});
app.get("/signupmentee", (req, res) => {
  res.render("signupmentee");
});
app.get("/signupmentor", (req, res) => {
  res.render("signupmentor");
});
app.get("/signupbtn", (req, res) => {
  res.render("signupbtn");
});
app.get("/login", (req, res) => {
  res.render("sign-in");
});

//create new user in db for mentee
app.post("/registermentee", async (req, res) => {
  try {
    const registeruser = await new RegisterSchema({
      name: req.body.name,
      password: req.body.password,
      phone: req.body.phone,
      email: req.body.email,
      role: "mentee",
      interest: req.body.interest.split(","),
    });
    registeruser.save();
    //mentor matching query
    const interestarray = req.body.interest.split(",");
    let queryarr = [];
    for (let index = 0; index < interestarray.length; index++) {
      queryarr.push({ interest: interestarray[index] });
    }
    let query = { $and: [{ $or: queryarr }, { role: "mentor" }] };
    console.log(query);
    const promiseresult = await RegisterSchema.find(query);
    console.log(promiseresult[0].name);
    res.status(201).render("index");
  } catch (error) {
    res.status(400).render("signupmentee");
  }
});

//create new user in db for mentor
app.post("/registermentor", upload.single("image"), async (req, res) => {
  try {
    console.log("reached before data image");
    const registeruser = await new RegisterSchema({
      name: req.body.name,
      password: req.body.password,
      phone: req.body.phone,
      email: req.body.email,
      role: "mentor",
      interest: req.body.interest.split(","),
      work: req.body.work,
      company: req.body.company,
      experience: req.body.experience,
      img: {
        data: fs.readFileSync(
          path.join(__dirname, `../uploads/${req.file.filename}`)
        ),
        contentType: "image/png",
      },
    });
    console.log("reached after data image");
    registeruser.save();
    console.log("koi error nhi aaya");
    console.log(registeruser.interest);
    res.status(201).render("index");
  } catch (error) {
    res.status(400).send(error);
  }
});

// Login check
app.post("/login", async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const useremail = await RegisterSchema.findOne({ email: email });
    if (useremail.password === password) {
      res.status(201).render("index");
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log("invalid login details");
    res.redirect("/login");
  }
});

//dashboard render
app.get("/dashboard", (req, res) => {
  RegisterSchema.find({ role: "mentor" }, function (err, RegisterSchema) {
    res.render("dashboard", { blogs: RegisterSchema });
    //Jimp.read(RegisterSchema, (err, res) => {
    //  if (err) throw new Error(err);
    //  res.quality(5).write("resized.jpg");
    //});
  });
});

//  Create a session
app.post("/createsession", async (req, res) => {
  try {
    const sessionuser = await new SessionSchema({
      name: req.body.name,
      date: req.body.date,
      description: req.body.description,
    });
    sessionuser.save();
    console.log(sessionuser.name);
    res.status(201).render("index");
  } catch (error) {
    res.status(400).send(error);
  }
});

app.get("/createsession", function (req, res) {
  SessionSchema.find({ name: "Dancer" }, function (err, data) {
    res.render("createsession", { session: data });
  });
});

app.listen(port, () => {
  console.log(`Listening at port http://127.0.0.1:${port}/login`);
});
