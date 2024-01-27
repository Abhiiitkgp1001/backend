const mongoose = require("mongoose");

const BmsSchema = new mongoose.Schema({
  voltage: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "VoltageSchema",
      },
    ],
  },
  temp: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TemperatureSchema",
      },
    ],
  },
  current: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CurrentSchema",
      },
    ],
  },
  bms_name: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("BmsSchema", BmsSchema);
