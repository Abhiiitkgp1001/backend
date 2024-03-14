import mongoose from "mongoose";

const TemperatureSchema = new mongoose.Schema({
  temperatureSensor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TemperatureSensors",
  },
  timestamp: {
    type: Date,
  },
  value: {
    type: Number,
  },
});

export default mongoose.model("Temperatures", TemperatureSchema);
