import mongoose from "mongoose";

const PilotStatsSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  },
  currentVehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vehicles",
  },
  driverRating: {
    type: Number,
    default: 0,
  },
  online: {
    type: Boolean,
    default: false,
  },
  allTrips: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Trips",
      },
    ],
  },
  drivingFlag: {
    type: [
      {
        type: String,
      },
    ],
  },
  warningFlag: {
    type: [
      {
        type: String,
      },
    ],
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
});

export default mongoose.model("PilotStats", PilotStatsSchema);
