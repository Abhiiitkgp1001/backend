import mongoose from "mongoose";

const ImuDataSchema = new mongoose.Schema({
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
    type: [
        {
            type: Number
        }
    ],
    default: [],
  },

});

export default mongoose.model("ImuData", ImuDataSchema);
