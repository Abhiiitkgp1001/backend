import mongoose from "mongoose";

const cellSchema = mongoose.Schema({
  bmsIc: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BmsIcs",
  },
  voltage: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Voltages",
      },
    ],
  },
  power: {
    type: Number,
    default: 0,
  },
});

export default mongoose.model("Cells", cellSchema);
