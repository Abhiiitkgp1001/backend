import mongoose from "mongoose";

const CurrentSchema = new mongoose.Schema({
  bmsIc: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BmsIcs",
    required: true,
  },
  timestamp: {
    type: Date,
    default: null,
  },
  value: {
    type: Number,
    default: 0,
  },
});

export default mongoose.model("Currents", CurrentSchema);
