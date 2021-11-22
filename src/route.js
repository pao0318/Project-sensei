const express = require("express");
var router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const Razorpay = require("razorpay");
var env = require("dotenv/config");

const razorpay = new Razorpay({
  key_id: process.env.KEY_ID,
  key_secret: process.env.KEY_SECRET,
});

require("dotenv/config");
const RegisterSchema = require("./models/registers");
const SessionSchema = require("./models/sessions");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    cb(null, "Photo" + "_" + Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

router.get("/", (req, res) => {
  RegisterSchema.findOne({ _id: req.session.userId }, function (err, data) {
    if (!data) {
      res.render("sign-in", { created: "" });
    } else {
      console.log("found sesion for " + data.name);
      //mentor
      if (data.role === "mentor") {
        RegisterSchema.find({ role: "mentor" }, function (err, valuefound) {
          if (err) console.log(err);
          else {
            SessionSchema.find({}, function (err, weekly_sessionfound) {
              res.render("indexmentor", {
                blogs: valuefound,
                weekly_session: weekly_sessionfound,
              });
            });
          }
        });
      }
      //mentee
      else {
        RegisterSchema.find({ role: "mentor" }, function (err, valuefound) {
          if (err) console.log(err);
          else {
            SessionSchema.find({}, function (err, weekly_sessionfound) {
              res.render("index", {
                blogs: valuefound,
                weekly_session: weekly_sessionfound,
              });
            });
          }
        });
      }
    }
  });
});

//view profile pafe of a mentor from mentee
router.get("/viewprofile/:id", async (req, res) => {
  RegisterSchema.findOne(
    { _id: req.session.userId },
    async function (err, data) {
      if (!data) {
        res.render("sign-in", { created: "" });
      } else {
        const id = req.params.id;
        try {
          const user = await RegisterSchema.findById(id);
          if (user) {
            res.render("viewprofile", { profileobject: user });
          } else {
            res.status(400).send({ error: "No id provided" });
          }
        } catch (error) {
          console.log(error);
        }
      }
    }
  );
});

//view profile pafe of a mentor from mentor
router.get("/viewprofilementor/:id", async (req, res) => {
  RegisterSchema.findOne(
    { _id: req.session.userId },
    async function (err, data) {
      if (!data) {
        res.render("sign-in", { created: "" });
      } else {
        const id = req.params.id;
        try {
          const user = await RegisterSchema.findById(id);
          if (user) {
            res.render("viewprofilementor", { profileobject: user });
          } else {
            res.status(400).send({ error: "No id provided" });
          }
        } catch (error) {
          console.log(error);
        }
      }
    }
  );
});

router.get("/signupmentee", (req, res) => {
  res.render("signupmentee");
});
router.get("/signupmentor", (req, res) => {
  res.render("signupmentor");
});
router.get("/signupbtn", (req, res) => {
  res.render("signupbtn");
});
router.get("/chat", (req, res) => {
  res.render("chat");
});

//create new user in db for mentee
router.post("/registermentee", async (req, res) => {
  try {
    var newPerson = new RegisterSchema({
      name: req.body.name,
      password: req.body.password,
      phone: req.body.phone,
      email: req.body.email,
      role: "mentee",
      interest: req.body.interest,
    });
    newPerson.save(function (err, Person) {
      if (err) {
        console.log(err);
        console.log(newPerson);
        res.render("signupmentee");
      } else console.log("Success sign up mentee");
    });
    res
      .status(201)
      .render("sign-in", { created: "Account created succesfully!" });
  } catch (error) {
    res.status(400).render("signupmentee");
  }
});

//create new user in db for mentor
router.post("/registermentor", upload.single("image"), async (req, res) => {
  try {
    const registeruser = await new RegisterSchema({
      name: req.body.name,
      password: req.body.password,
      phone: req.body.phone,
      email: req.body.email,
      role: "mentor",
      interest: req.body.interest,
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
    registeruser.save(function (err, Person) {
      if (err) {
        console.log(err);
        res.render("signupmentor");
      } else {
        console.log("Success signup mentor");
        res
          .status(201)
          .render("sign-in", { created: "Account created succesfully!" });
      }
    });
  } catch (error) {
    res.status(400).send(error);
  }
});

// Login check
router.post("/login", async (req, res, next) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const useremail = await RegisterSchema.findOne({ email: email });
    if (useremail.password === password) {
      req.session.userId = useremail._id;
      //mentor
      if (useremail.role === "mentor") {
        RegisterSchema.find({ role: "mentor" }, function (err, valuefound) {
          SessionSchema.find(
            { role: "mentor" },
            function (err, weekly_sessionfound) {
              res.render("indexmentor", {
                blogs: valuefound,
                weekly_session: weekly_sessionfound,
              });
            }
          );
        });
      }
      //mentee
      else {
        RegisterSchema.find({ role: "mentor" }, function (err, valuefound) {
          SessionSchema.find(
            { role: "mentor" },
            function (err, weekly_sessionfound) {
              res.render("index", {
                blogs: valuefound,
                weekly_session: weekly_sessionfound,
              });
            }
          );
        });
      }
    } else {
      console.log("invalid password");
      res.render("sign-in", { created: "" });
    }
  } catch (error) {
    console.log("email not register");
    res.render("sign-in", { created: "" });
  }
});

//profile mentee
router.get("/profilementee", (req, res) => {
  RegisterSchema.findOne({ _id: req.session.userId }, function (err, data) {
    if (!data) {
      res.render("sign-in", { created: "" });
    } else {
      //console.log("found");
      console.log("user profile name and id is");
      console.log(data.name);
      console.log(data._id);
      res.render("profilementee", { profileobject: data });
    }
  });
});

//profile mentor
router.get("/profilementor", (req, res) => {
  RegisterSchema.findOne({ _id: req.session.userId }, function (err, data) {
    if (!data) {
      res.render("sign-in", { created: "" });
    } else {
      //console.log("found");
      console.log("user profile name and id is");
      console.log(data.name);
      console.log(data._id);
      res.render("profilementor", { profileobject: data });
    }
  });
});

//  Create a session
router.post("/createsession", async (req, res) => {
  RegisterSchema.findOne(
    { _id: req.session.userId },
    async function (err, data) {
      if (!data) {
        res.render("sign-in", { created: "" });
      } else {
        try {
          const sessionuser = await new SessionSchema({
            name: req.body.name,
            date: req.body.date,
            description: req.body.description,
            email: data.email,
          });
          sessionuser.save();
          console.log(sessionuser.name);
          res.status(201).redirect("/createsession");
        } catch (e) {
          console.log("error creating session by mentor" + e);
          res.status(400).redirect("/");
        }
      }
    }
  );
});

router.get("/createsession", function (req, res) {
  RegisterSchema.findOne({ _id: req.session.userId }, function (err, data) {
    if (!data) {
      res.render("sign-in", { created: "" });
    } else {
      SessionSchema.find({ email: data.email }, function (err, data) {
        if (!data) res.render("createsession", { session: [] });
        else res.render("createsession", { session: data });
      });
    }
  });
});

//mentormatching
router.get("/matchmentor", (req, res) => {
  RegisterSchema.findOne({ _id: req.session.userId }, function (err, data) {
    if (!data) {
      res.render("sign-in", { created: "" });
    } else {
      console.log("found session");
      // //mentor matching query
      const interestarray = data.interest;
      let queryarr = [];
      for (let index = 0; index < interestarray.length; index++) {
        queryarr.push({ interest: interestarray[index] });
      }
      let query = { $and: [{ $or: queryarr }, { role: "mentor" }] };
      //console.log(query);
      RegisterSchema.find(query, function (err, valuefound) {
        if (!valuefound) res.render("matchmentor", { blogs: [] });
        res.render("matchmentor", { blogs: valuefound });
      });
    }
  });
});
// Book a mentor
router.post("/order", (req, res) => {
  let options = {
    amount: 22000,
    currency: "INR",
  };
  razorpay.orders.create(options, function (err, order) {
    console.log(order);
    res.json(order);
  });
});

router.post("/isordercomplete", (req, res) => {
  razorpay.payments
    .fetch(req.body.razorpay_payment_id)
    .then((paymentDocument) => {
      if (paymentDocument.status == "captured") {
        res.redirect("profilementee");
      } else {
        res.status(400);
      }
    });
});

//filter for metee page
router.post("/filter", (req, res) => {
  RegisterSchema.findOne({ _id: req.session.userId }, function (err, data) {
    if (!data) {
      res.render("sign-in", { created: "" });
    } else {
      console.log(req.body.name);
      let query = { $and: [{ interest: req.body.name }, { role: "mentor" }] };
      console.log("found sesion " + data.name + " " + data.role);
      if (data.role === "mentor") {
        RegisterSchema.find(query, function (err, valuefound) {
          if (err) console.log(err);
          else {
            SessionSchema.find({}, function (err, weekly_sessionfound) {
              res.render("indexmentor", {
                blogs: valuefound,
                weekly_session: weekly_sessionfound,
              });
            });
          }
        });
      } else {
        RegisterSchema.find(query, function (err, valuefound) {
          if (err) console.log(err);
          else {
            SessionSchema.find({}, function (err, weekly_sessionfound) {
              res.render("index", {
                blogs: valuefound,
                weekly_session: weekly_sessionfound,
              });
            });
          }
        });
      }
    }
  });
});

// logout
router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

module.exports = router;
