const mongoose=require("mongoose");
mongoose.connect(process.env.MONGO_URL,{
    useNewUrlParser: true,
    useUnifiedTopology: true
  }).then(()=>{
    //console.log(`succesful connection`);
  }).catch((e)=>{
      console.log(`mongoose connection error ${e}`);
  });