const mongoose = require("mongoose");

const VehicleSchema = mongoose.Schema({
  registrationNumber: {
    type: String,
    required: true,
  },
  linkedPilots: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserSchema",
      },
    ],
  },
  vehicleLoadType: {
    type: Boolean, // heavy or light weight
    required: true,
  },
  vehicleWheelType: {
    type: Number, // vehicle wheel type 2 , 3 more
    required: true,
    min: 2,
  },
  currentPilot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserSchema",
  },
  deviceId: {
    // device
    type: mongoose.Schema.Types.ObjectId,
    ref: "DeviceSchema",
  },
  archived: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("Vehicle", VehicleSchema);
