import mongoose from "mongoose";

const SessionSchema = new mongoose.Schema({
  device: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Devices",
    required: true,
  },
  tripName: {
    // wiil ask
    type: String,
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  location: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Locations",
      },
    ],
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
});

export default mongoose.model("Trips", SessionSchema);
