import mongoose from "mongoose";

const TemperatureSchema = new mongoose.Schema({
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
  temp_name: {
    type: String,
    required: true,
  },
});

export default mongoose.model("Temperatures", TemperatureSchema);
