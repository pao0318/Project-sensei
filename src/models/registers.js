const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: Number,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  interest: {
    type: [String],
    required: true,
  },
  work: {
    type: String,
  },
  company: {
    type: String,
  },
  experience: {
    type: Number,
  },
  img: {
    data: Buffer,
    contentType: String,
  },
  sessions: {
    type: [String],
  },
  enrolled: {
    type: [
      {
        name:String,
        id:String
     }
     ],
  },
  chatnotification: {
    type: {
      from:String,
      fromId:String,
      toId:String,
      message:String
   }
  },
  reviews: {
    type: [
      {
      from:String,
      fromId:String,
      toId:String,
      review:String
   }
  ]
  },
});

module.exports = mongoose.model("Register", userSchema);
