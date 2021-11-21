const express = require("express");
var router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");

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
  RegisterSchema.findOne({_id:req.session.userId},function(err,data){
		if(!data){
      res.render("sign-in",{created:""});
		}else{
			console.log("found sesion");
      RegisterSchema.find({ role: "mentor" }, function (err, valuefound) {
       if(err) console.log(err);
       res.render("index", { blogs: valuefound });
      });
		}
});
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

//create new user in db for mentee
router.post("/registermentee", async (req, res) => {
  try {
    // //mentor matching query
    // const interestarray = req.body.interest.split(",");
    // let queryarr = [];
    // for (let index = 0; index < interestarray.length; index++) {
    //   queryarr.push({ interest: interestarray[index] });
    // }
    // // let query = { $and: [{ $or: queryarr }, { role: "mentor" }] };
    // // console.log(query);
    // // const promiseresult=await RegisterSchema.find(query);
    // // console.log(promiseresult[0].name);
    var newPerson = new RegisterSchema({
      name: req.body.name,
      password: req.body.password,
      phone: req.body.phone,
      email: req.body.email,
      role: "mentee",
      interest: req.body.interest.split(","),
    });
    newPerson.save(function (err, Person) {
      if (err){
      console.log(err);
      console.log(newPerson);
    res.render("signupmentee");
      }
      else console.log("Success sign up mentee");
    });
    res.status(201).render("sign-in",{created:"Account created succesfully!"});

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
    registeruser.save(function (err, Person) {
      if (err){
      console.log(err);
      res.render("signupmentor");
      }
      else {
        console.log("Success signup mentor");
       res.status(201).render("sign-in",{created:"Account created succesfully!"});
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
<<<<<<< Updated upstream
      RegisterSchema.find({ role: "mentor" }, function (err, valuefound) {
        if(!valuefound) ("index",{blogs: []});
        res.render("index", { blogs: valuefound });
=======
      RegisterSchema.find({ role: "mentor" }, function (err, RegisterSchema) {
        res.render("index", { blogs: RegisterSchema });
>>>>>>> Stashed changes
      });
    } else {
      console.log("invalid password");
      res.render("sign-in", { created: "" });
    }
  } catch (error) {
    console.log("email not register");
    res.render("sign-in", { created: "" });
  }
});


//dashboard render
<<<<<<< Updated upstream
router.get("/dashboard", (req, res) => {
  RegisterSchema.findOne({_id:req.session.userId},function(err,data){
		if(!data){
      res.render("sign-in",{created:""});
		}else{
		 console.log("found session");
      RegisterSchema.find({ role: "mentor" }, function (err, valuefound) {
        if(!valuefound) ("index",{blogs: []});
        res.render("index", { blogs: valuefound });
      });
		}
});
});
=======
// router.get("/index", (req, res) => {
//   RegisterSchema.findOne({_id:req.session.userId},function(err,data){
// 		if(!data){
//       res.render("sign-in",{created:""});
// 		}else{
// 		 console.log("found session");
//       RegisterSchema.find({ role: "mentor" }, function (err, RegisterSchema) {
//         res.render("index", { blogs: RegisterSchema });
//       });
// 		}
// });
// });
>>>>>>> Stashed changes

//profile render
router.get("/profilementee", (req, res) => {
console.log("inside profile");
	RegisterSchema.findOne({_id:req.session.userId},function(err,data){
		if(!data){
      res.render("sign-in",{created:""});
		}else{
			//console.log("found");
      console.log("user profile name and id is");
      console.log(data.name);
      console.log(data._id);
      res.render("profilementee", { profileobject: data });
		}
	});
});

//sid change


//  Create a session
router.post("/createsession", async (req, res) => {
	RegisterSchema.findOne({_id:req.session.userId},async function(err,data){
		if(!data){
      res.render("sign-in",{created:""});
		}else{  
    const sessionuser = await new SessionSchema({
      name: req.body.name,
      date: req.body.date,
      description: req.body.description,
    });
    sessionuser.save();
    console.log(sessionuser.name);
    res.status(201).redirect("/createsession");
  }
});
});

router.get("/createsession", function (req, res) {
  RegisterSchema.findOne({_id:req.session.userId},function(err,data){
		if(!data){
      res.render("sign-in",{created:""});
		}else{ 
  SessionSchema.find({}, function (err, data) {
    if(!data) res.render("createsession", { session: [] });
    else res.render("createsession", { session: data });
  });
}
});
});
//sid ends

// logout
router.get('/logout',(req,res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;