import mongoose from "mongoose";

const ProfileSchema = new mongoose.Schema({
  first_name: {
    type: String,
    default: "",
  },
  last_name: {
    type: String,
    default: "",
  },
  email: {
    type: String,
    required: true,
    // match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  phone_number: {
    type: String,
    required: true,
    // match: /^(?=\d{10}$)\d*(\d)\1{9}$/,
  },
  aadhar: {
    type: String,
    default: "",
    // match: /^[2-9]{1}[0-9]{3}\s[0-9]{4}\s[0-9]{4}$/
  },
  pancard: {
    type: String,
    default: "0000000000",
    // minlength: 10,
    // maxlenght: 10,
    // match: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
  },
  address: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Address",
    default: null,
  },
  working_address: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Address",
    default: null,
  },
  driving_license: {
    type: String,
    default: "",
  },
  profile_pic: {
    type: String,
    default: "",
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  },
  dateOfBirth: {
    type: Date,
    default: null,
  },
});

export default mongoose.model("Profiles", ProfileSchema);
