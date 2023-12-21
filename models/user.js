const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  profile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProfileSchema",
  },
  devices: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DeviceSchema",
      },
    ],
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone_number: {
    type: String,
    required: true,
  },
  admin: {
    type: Boolean,
    required: true,
  },
  childUsers: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserSchema",
      },
    ],
  },
});

module.exports = mongoose.model("UserSchema", UserSchema);

// user_id: uuid(PK);
// profile: Ref_id;
// mobile_no: int;
// email: String;
// password: String;
// admin: bool;
// devices: [Ref_id];
