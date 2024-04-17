import mongoose from "mongoose";

const GpsDataSchema = new mongoose.Schema({
  bmsIc: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BmsIcs",
    required: true,
  },
  timestamp: {
    type: Date,
    default: null,
  },
  latitude: {
    type: Number,
    default: 0,
  },
  longitude: {
    type: Number,
    default: 0,
  }
});

export default mongoose.model("GpsData", GpsDataSchema);
