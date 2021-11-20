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
});

module.exports = mongoose.model("Register", userSchema);