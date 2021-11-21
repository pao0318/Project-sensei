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
       else
       {
         SessionSchema.find({}, function (err, weekly_sessionfound){
         res.render("index", { blogs: valuefound, weekly_session: weekly_sessionfound });
         })
       }
      });
		}
});
});


router.get("/viewprofile", (req, res) => {
  res.render("viewprofile");
});
router.post('/viewprofile', (req,res)=>{
  console.log("Deleted button has been clicked: "+ req.body.buttonId)
  })

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
      RegisterSchema.find({ role: "mentor" }, function (err, valuefound) {
        if(!valuefound) res.render("index",{blogs: [], weekly_session: []});
        else
       {
         SessionSchema.find({ role: "mentor" }, function (err, weekly_sessionfound){
         res.render("index", { blogs: valuefound, weekly_session: weekly_sessionfound });
         })
       }
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

//mentormatching
router.get("/matchmentor",(req,res)=>{
  RegisterSchema.findOne({_id:req.session.userId},function(err,data){
		if(!data){
      res.render("sign-in",{created:""});
		}else{
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
        if(!valuefound) res.render("matchmentor",{blogs: []});
        res.render("matchmentor", { blogs: valuefound });
      });
		}
});
});

//filter for metee page
router.post("/filter",(req,res)=>{
  RegisterSchema.findOne({_id:req.session.userId},function(err,data){
		if(!data){
      res.render("sign-in",{created:""});
		}
    else{
      let query = { $and: [{ interest: req.body.name } , { role: "mentor" }] };
			console.log("found sesion");
      RegisterSchema.find(query, function (err, valuefound) {
       if(err) console.log(err);
       else
       {
         SessionSchema.find({}, function (err, weekly_sessionfound){
         res.render("index", { blogs: valuefound, weekly_session: weekly_sessionfound });
         })
       }
      });
		}
  });
})


// logout
router.get('/logout',(req,res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;