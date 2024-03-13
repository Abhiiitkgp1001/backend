import mongoose from "mongoose";

const VoltageSchema = new mongoose.Schema({
  bms_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Bms",
    required: true,
  },
  data: {
    type: [
      {
        timeStamp: {
          type: Date,
          required: true,
        },
        value: {
          type: Number,
          required: true,
        },
      },
    ],
  },
  cell_name: {
    type: String,
    required: true,
  },
});

export default mongoose.model("Voltages", VoltageSchema);
