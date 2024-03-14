import mongoose from "mongoose";

const tempSensorsSchema = mongoose.Schema({
  bmsIc: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BmsIcs",
    required: true,
  },
  temperatures: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Temperatures",
      },
    ],
  },
});

export default mongoose.model("TemperatureSensors", tempSensorsSchema);
