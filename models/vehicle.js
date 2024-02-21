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
  vehicleName: {
    type: String,
    default: "",
  },
  modelName: {
    type: String,
    default: "",
  },
  vehiclePhoto: {
    type: String,
    default: "",
  },
  chassisNumber: {
    type: String,
    default: "",
  },
  ownerName: {
    type: String,
    default: "",
  },
  vehicleRc: {
    type: String,
    default: "",
  },
  vehiclePucc: {
    type: String,
    default: "",
  },
  vehicleInsurance: {
    type: String,
    default: "",
  },
  kmDriven: {
    type: Number,
    default: 0,
  },
  fuelSaved: {
    type: Number,
    default: 0,
  },
  co2Reduced: {
    type: Number,
    default: 0,
  },
  purchaseDate: {
    type: Date,
  },
  lastServiceDate: {
    type: Date,
  },
  maintenanceDuedate: {
    type: Date,
  },
  onGoingTrip: {
    type: mongoose.Types.ObjectId,
    ref: "Trips",
    default: null,
  },
  allTrips: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Trips",
        default: null,
      },
    ],
  },
});

module.exports = mongoose.model("Vehicles", VehicleSchema);
