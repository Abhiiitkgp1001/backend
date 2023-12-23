const mongoose = require("mongoose");

const VehicleSchema = mongoose.Schema({
  registrationNumber: {
    type: String,
    required: true,
  },
  allowedUsers: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserSchema",
      },
    ],
  },
  vehicleLoadType: {
    type: Boolean,
    required: true,
  },
    vehicleWheelType: {
        type: Number,
        required: true,
  },
  currentPilot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserSchema",
  },
  deviceId: {},
});
