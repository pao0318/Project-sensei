const express = require("express");
var router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const Razorpay = require("razorpay");
var env = require("dotenv/config");
var ObjectId = require("mongodb").ObjectId;
let enrolledmentor = "";
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
        }).sort({"experience":-1});
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
        }).sort({"experience":-1});
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
          enrolledmentor = id;
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

//view profile page of a mentor from mentor
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

//add review

router.post("/addreview/:id", async (req, res) => {
  RegisterSchema.findOne(
    { _id: req.session.userId },
    async function (err, data) {
      if (!data) {
        res.render("sign-in", { created: "" });
      } else {
        const id = req.params.id;
        try {
          const ment = await RegisterSchema.findById(id);
          const review = req.body.review;
          if (ment) {
            const reviewobject = {
              from: data.name,
              fromId: data._id.toString(),
              toId: id,
              review: review,
            };
            ment.reviews.push(reviewobject);
            ment.save();
            res.redirect("/");
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


// discussion forum for mentee
router.get("/discussion", (req, res) => {
  RegisterSchema.findOne({ _id: req.session.userId }, function (err, data) {
    if (!data) {
      res.render("sign-in", { created: "" });
    } else {
      if (data.role === "mentor") {
        res.send(
          "<h2>Sorry requested page not found! Check url once again</h2>"
        );
      } else{
        res.render("discussion");
      }
        
    }
  });
});

//chat notifications for mentor and mentee
router.get("/chatnotifications", (req, res) => {
  RegisterSchema.findOne({ _id: req.session.userId }, function (err, data) {
    if (!data) {
      res.render("sign-in", { created: "" });
    } else {
      //mentor
      if (data.role === "mentor") {
        if (data.chatnotification == undefined) {
          res.render("notificationsmentor", { chatmessage: "" });
        } else
          res.render("notificationsmentor", {
            chatmessage: data.chatnotification,
          });
      } 
      //mentee
      else {
        if (data.chatnotification == undefined) {
          res.render("notificationsmentee", { chatmessage: "" });
        } else
          res.render("notificationsmentee", {
            chatmessage: data.chatnotification,
          });
      }
    }
  });
});

//for sending message to mentor or mentee
router.post("/sendmessage/:id", async (req, res) => {
  RegisterSchema.findOne(
    { _id: req.session.userId },
    async function (err, data) {
      if (!data) {
        res.render("sign-in", { created: "" });
      } else {
        const id = req.params.id;
        try {
          const message = req.body.message;
          let find=false;
        for(let i=0;i<data.chatnotification.length;i++){
         if(data.chatnotification[i]===null) continue;
          if(data.chatnotification[i]._id.toString()==id){
           find=true;
            const ment = await RegisterSchema.findById(data.chatnotification[i].fromId);
            const chatobj= {
              from: data.name,
              fromId: data._id.toString(),
              toId: id,
              message: message,
            };
            ment.chatnotification.push(chatobj);
            ment.save();
            // data.chatnotification[i]=undefined;
            data.chatnotification.splice(i,1);
            data.save();
            
            break;
          }
        }

        //if message initiated first time
        if(!find){
          const ment = await RegisterSchema.findById(id);
          if (ment) {
            const chatobj= {
              from: data.name,
              fromId: data._id.toString(),
              toId: id,
              message: message,
            };
            ment.chatnotification.push(chatobj);
            ment.save();
        }
      }
            res.redirect("/chatnotifications");
         
        } catch (error) {
          console.log(error);
        }
      }
    }
  );
});

//add progress by mentor
router.post("/addprogress/:id", async (req, res) => {
  RegisterSchema.findOne(
    { _id: req.session.userId },
    async function (err, data) {
      if (!data) {
        res.render("sign-in", { created: "" });
      } else {
        const id = req.params.id;
        try {
          const ment = await RegisterSchema.findById(id);
          const progress = req.body.progress;
          if (ment) {
            for(let i=0;i<ment.enrolled.length;i++){
               if(ment.enrolled[i].id==data._id.toString()){
                 console.log(progress)
                 ment.enrolled[i].progresswidth = progress;
                 ment.save();
                 break;
               }
             }
            res.redirect("/");
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
            {},
            function (err, weekly_sessionfound) {
              res.render("indexmentor", {
                blogs: valuefound,
                weekly_session: weekly_sessionfound,
              });
            }
          );
        }).sort({"experience":-1});
      }
      //mentee
      else {
        RegisterSchema.find({ role: "mentor" }, function (err, valuefound) {
          SessionSchema.find(
            {},
            function (err, weekly_sessionfound) {
              res.render("index", {
                blogs: valuefound,
                weekly_session: weekly_sessionfound,
              });
            }
          );
        }).sort({"experience":-1});
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

//profile mentee and mentor
router.get("/profile", (req, res) => {
  RegisterSchema.findOne({ _id: req.session.userId }, function (err, data) {
    if (!data) {
      res.render("sign-in", { created: "" });
    } else {
      console.log("user profile name and id is");
      console.log(data.name);
      console.log(data._id);
      if(data.role==="mentor"){
        res.render("profilementor", { profileobject: data });
      }
      else res.render("profilementee", { profileobject: data });
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
        if (data.role === "mentor") {
          try {
            const sessionuser = await new SessionSchema({
              name: req.body.name,
              date: req.body.date,
              description: req.body.description,
              email: data.email,
              author:data.name,
            });
            sessionuser.save();
            console.log(sessionuser.name);
            res.status(201).redirect("/createsession");
          } catch (e) {
            console.log("error creating session by mentor" + e);
            res.status(400).redirect("/");
          }
        } else {
          res.send(
            "<h2>Sorry requested page not found! Check url once again</h2>"
          );
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
      if (data.role === "mentor") {
        SessionSchema.find({ email: data.email }, function (err, data) {
          if (!data) res.render("createsession", { session: [] });
          else res.render("createsession", { session: data });
        });
      } else {
        res.send(
          "<h2>Sorry requested page not found! Check url once again</h2>"
        );
      }
    }
  });
});

//mentormatching
router.get("/matchmentor", (req, res) => {
  RegisterSchema.findOne({ _id: req.session.userId }, function (err, data) {
    if (!data) {
      res.render("sign-in", { created: "" });
    } else {
      if (data.role === "mentee") {
        console.log("found session");
        const interestarray = data.interest;
        let queryarr = [];
        for (let index = 0; index < interestarray.length; index++) {
          queryarr.push({ interest: interestarray[index] });
        }
        let query = { $and: [{ $or: queryarr }, { role: "mentor" },{ experience: { $gt: 9 }} ] };
        //console.log(query);
        RegisterSchema.find(query, function (err, valuefound) {
          if (!valuefound) res.render("matchmentor", { blogs: [] });
          res.render("matchmentor", { blogs: valuefound });
        }).sort({"experience":-1});
      } else {
        res.send(
          "<h2>Sorry requested page not found! Check url once again</h2>"
        );
      }
    }
  });
});

// Book a mentor
router.post("/order", (req, res) => {
  RegisterSchema.findOne({ _id: req.session.userId }, function (err, data) {
    if (!data) {
      res.render("sign-in", { created: "" });
    } else {
      let options = {
        amount: 20000,
        currency: "INR",
      };
      razorpay.orders.create(options, function (err, order) {
        //console.log(order);
        res.json(order);
      });
    }
  });
});

router.post("/isordercomplete", async (req, res) => {
  RegisterSchema.findOne(
    { _id: req.session.userId },
    async function (err, data) {
      if (!data) {
        res.render("sign-in", { created: "" });
      } else {
        razorpay.payments
          .fetch(req.body.razorpay_payment_id)
          .then(async (paymentDocument) => {
            if (paymentDocument.status == "captured") {
              const ment = await RegisterSchema.findById(enrolledmentor);
              // console.log(data._id);
              // enrolledmentor="";
              // console.log(ment.name);
              data.enrolled.push({ name: ment.name, id: enrolledmentor, progresswidth: 0 });
              data.save();
              ment.enrolled.push({ name: data.name, id: data._id.toString(), progresswidth: 0  });
              ment.save();
              enrolledmentor = "";
              console.log(data.enrolled);
              res.render("profilementee", { profileobject: data });
            } else {
              res.status(400).send("Booking unsucceful Please try again later");
            }
          });
      }
    }
  );
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
        }).sort({"experience":-1});
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
        }).sort({"experience":-1});
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
