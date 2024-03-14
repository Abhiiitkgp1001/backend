import mongoose from "mongoose";

const VoltageSchema = new mongoose.Schema({
  cell: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cells",
  },
  timestamp: {
    type: Date,
  },
  value: {
    type: Number,
  },
});

export default mongoose.model("Voltages", VoltageSchema);
