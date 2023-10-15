const mongoose = require("mongoose");

const VoltageSchema = new mongoose.Schema({
  // cell_id: {
  //     type: String,
  //     required: true,
  //     unique: true,
  // },
  bms_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BmsSchema",
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
  cell_name: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("VoltageSchema", VoltageSchema);
