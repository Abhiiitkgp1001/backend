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
        ref: "Users",
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
    max: 4,
  },
  currentPilot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    default: null,
  },
  device: {
    // device
    type: mongoose.Schema.Types.ObjectId,
    ref: "Devices",
    default: null,
  },
  archived: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("Vehicles", VehicleSchema);
