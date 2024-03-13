import mongoose from "mongoose";

const CurrentSchema = new mongoose.Schema({
  // current_id: {
  //     type: String,
  //     required: true,
  //     unique: true,
  // },
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
  current_name: {
    type: String,
    required: true,
  },
});

export default mongoose.model("Currents", CurrentSchema);
