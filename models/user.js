import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  profile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Profiles",
    required: true,
  },
  devices: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Devices",
      },
    ],
  },
  email: {
    type: String,
    required: true,
    // match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  password: {
    type: String,
    required: true,
  },
  phone_number: {
    type: String,
    required: true,
    // match: /^(?=\d{10}$)\d*(\d)\1{9}$/,
  },
  admin: {
    type: Boolean,
    required: true,
  },
  accountLock: {
    type: Boolean,
    default: false,
  },
  childUsers: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
      },
    ],
  },
  archived: {
    type: Boolean,
    default: false,
  },
  addedVehicles: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vehicles",
      },
    ],
  },
  allowedVehicles: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vehicles",
      },
    ],
  },
  pilotStats: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PilotStats",
    default: null,
  },
});

export default mongoose.model("Users", UserSchema);
