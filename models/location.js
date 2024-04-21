import mongoose from "mongoose";
import { generateCurTime } from "../utils/helper.js";

const LocationSchema = new mongoose.Schema({
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Trips",
  },
  timestamp: {
    type: Date,
    default: generateCurTime(),
  },
  lattitude: {
    type: Number,
  },
  longitude: {
    type: Number,
  },
});

export default mongoose.model("Locations", LocationSchema);
