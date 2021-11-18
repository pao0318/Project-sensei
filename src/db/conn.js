const mongoose=require("mongoose");
mongoose.connect('mongodb://localhost:27017/usersdb',{
    useNewUrlParser: true,
    useUnifiedTopology: true
  }).then(()=>{
    //console.log(`succesful connection`);
  }).catch((e)=>{
      console.log(`mongoose connection error ${e}`);
  });