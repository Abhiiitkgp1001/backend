import mongoose from "mongoose";

const BmsSchema = new mongoose.Schema({
  voltage: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Voltages",
      },
    ],
  },
  temp: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Temperatures",
      },
    ],
  },
  current: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Currents",
      },
    ],
  },
  bms_name: {
    type: String,
    required: true,
  },
});

export default mongoose.model("Bms", BmsSchema);
