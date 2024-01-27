const mongoose = require("mongoose");

const SessionSchema = new mongoose.Schema({
  device_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DeviceSchema",
    required: true,
  },
  no_of_bms: {
    type: Number,
    required: true,
  },
  bms: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BmsSchema",
      },
    ],
  },
  session_name: {
    type: String,
    required: true,
  },
  start_time: {
    type: Date,
    required: true,
  },
  end_time: {
    type: Date,
    required: true,
  },
});

module.exports = mongoose.model("SessionSchema", SessionSchema);
