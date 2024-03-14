import mongoose from "mongoose";

const addressSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  },
  profile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Profiles",
  },
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
    default: "000000",
    minlength: 6, // Minimum length constraint
    maxlength: 6, // Maximum length constraint
    // match: /^[0-9]{6}$/, // Regular expression pattern constraint
  },
  country: {
    type: String,
    default: "",
  },
});

export default mongoose.model("Address", addressSchema);
