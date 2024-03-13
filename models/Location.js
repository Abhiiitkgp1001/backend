import mongoose from "mongoose";

const LocationSchema = mongoose.Schema({
  street: {
    type: String,
    default: "",
  },
  city: {
    type: String,
    default: "",
  },

  district: {
    type: String,
    default: "",
  },
  state: {
    type: String,
    default: "",
  },
  pin_code: {
    type: String,
    default: "",
  },
});

export default mongoose.model("Locations", LocationSchema);
