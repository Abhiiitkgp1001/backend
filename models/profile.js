const mongoose = require("mongoose");

const ProfileSchema = new mongoose.Schema({
  first_name: {
    type: String,
  },
  last_name: {
    type: String,
  },
  email: {
    type: String,
    required: true,
  },
  phone_number: {
    type: String,
    required: true,
  },
  aadhar: {
    type: String,
  },
  pancard: {
    type: String,
  },
  address: {
    type: String,
  },
  driving_license: {
    type: String,
  },
  profile_pic: {
    type: String,
  },
});

module.exports = mongoose.model("ProfileSchema", ProfileSchema);

// Profile Modal
//     profile_id : uuid (PK)
//     first_name : String
//     last_name : String
//     email : String
//     mobile_no : String
//     driving_license_no : String
//     address : String
//     pan_card_no :  String
//     aadhar_card_no : String
