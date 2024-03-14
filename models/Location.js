import mongoose from "mongoose";

const LocationSchema = mongoose.Schema({
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Trips",
  },
  timestamp: {
    type: Date,
  },
  lattitude: {
    type: Number,
  },
  longitude: {
    type: Number,
  },
});

export default mongoose.model("Locations", LocationSchema);
