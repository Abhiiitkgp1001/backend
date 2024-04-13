import mongoose from "mongoose";
const BmsIcSeriesSchema = new mongoose.Schema({
  series: {
    type: String,
    required: true,
    unique: true,
  },
  countTotal: {
    type: Number,
    default: 0,
  },
});

export default mongoose.model("BmsIcsSeries", BmsIcSeriesSchema);
