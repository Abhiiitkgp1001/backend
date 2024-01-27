const mongoose = require("mongoose");

const CurrentSchema = new mongoose.Schema({
  // current_id: {
  //     type: String,
  //     required: true,
  //     unique: true,
  // },
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
  current_name: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("CurrentSchema", CurrentSchema);
