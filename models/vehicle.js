import mongoose from "mongoose";

const VehicleSchema = mongoose.Schema({
  adminUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  },
  registrationNumber: {
    type: String,
  },
  allowedPilots: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
      },
    ],
  },
  vehicleLoadType: {
    type: String, // heavy or light weight
    required: true,
    default: "LIGHT",
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
    default: []
  },
});

export default mongoose.model("Vehicles", VehicleSchema);
