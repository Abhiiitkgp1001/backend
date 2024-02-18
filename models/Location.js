const mongoose = require("mongoose");

const LocationSchema = mongoose.Schema({
  street: {
    type: String,
    default: "",
  },
  city: {
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

module.exports = mongoose.model("Locations", LocationSchema);
