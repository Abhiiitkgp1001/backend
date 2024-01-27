const mongoose = require("mongoose");

const TemperatureSchema = new mongoose.Schema({
  bms_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BmsSchema",
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

module.exports = mongoose.model("TemperatureSchema", TemperatureSchema);
