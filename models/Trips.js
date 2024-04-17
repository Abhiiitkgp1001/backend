import mongoose from "mongoose";
import { tripEnums } from "../enums/tripEnum.js";
import { generateCurTime, generateTripName } from "../utils/helper.js";
const TripSchema = new mongoose.Schema({
  device: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Devices",
    required: true,
  },
  tripName: {
    type: String,
    default: generateTripName(),
  },
  startTime: {
    type: Date,
    required: generateCurTime(),
  },
  endTime: {
    type: Date,
    required: generateCurTime(),
  },
  location: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Locations",
      },
    ],
    default: null,
  },
  pilot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  },
  speed: {
    type: Number,
    default: 0,
  },
  distance: {
    type: Number,
    default: 0,
  },
  state: {
    type: String,
    default: tripEnums.STATIC,
  },
});

export default mongoose.model("Trips", TripSchema);
