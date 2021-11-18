const express=require('express');
const app=express();
const path=require("path");
const hbs=require("hbs");
const fs = require("fs");
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/usersdb";

require("./db/conn");

const RegisterSchema=require('./models/registers');
const port=process.env.PORT || 3000;

const static_path=path.join(__dirname,"../public");
const template_path=path.join(__dirname,"../templates/views");
const partials_path=path.join(__dirname,"../templates/partials");

app.use(express.json());
app.use(express.urlencoded({extended:false}));

app.use(express.static(static_path));
app.set("view engine","hbs");
app.set("views",template_path);
hbs.registerPartials(partials_path);

app.get('/',(req,res)=>{
    res.render("index")
});

app.get('/signupmentee',(req,res)=>{
    res.render("signupmentee");
});
app.get('/signupmentor',(req,res)=>{
    res.render("signupmentor");
});
app.get('/signupbtn',(req,res)=>{
    res.render("signupbtn");
});
app.get('/login',(req,res)=>{
    res.render("sign-in");
});

//create new user in db for mentee
app.post('/registermentee',async(req,res)=>{
try {      
const registeruser=await new RegisterSchema({
    name:req.body.name,
    password:req.body.password,
    phone:req.body.phone,
    email:req.body.email,
    role:"mentee",
    interest:req.body.interest.split(",")
});
registeruser.save();
MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    let dbo = db.db("usersdb");
   const interestarray=req.body.interest.split(",");
   let queryarr=[];
   for (let index = 0; index < interestarray.length; index++) {
       queryarr.push({interest:interestarray[index]});
   }
    let query = {$and:[{$or:queryarr},{role:"mentor"}]};
    console.log(query);
    dbo.collection("registers").find(query).toArray(function(err, result) {
      if (err) throw err;
      console.log(result);
    // res.status(201).send(result);
     res.status(201).render('index');
      db.close();
    });
  });

} catch (error) {
    res.status(400).send(error);
}
});
//create new user in db for mentor
app.post('/registermentor',async(req,res)=>{
    try {
    const registeruser=await new RegisterSchema({
        name:req.body.name,
        password:req.body.password,
        phone:req.body.phone,
        email:req.body.email,
        role:"mentor",
        interest:req.body.interest.split(","),
        work:req.body.work,
        company:req.body.company,
        experience:req.body.experience
    });
    registeruser.save();
    console.log(registeruser.interest);
    res.status(201).render('index');
    } catch (error) {
        res.status(400).send(error);
    }
    });

//dashboard render
app.get('/dashboard',(req,res)=>{
    res.render("dashboard");
});

app.listen(port,()=>{
console.log(`Listening at port http://localhost:${port}/login`);
})