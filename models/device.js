const mongoose = require("mongoose");

const DeviceSchema = new mongoose.Schema({
  // device_id: {
  //     type: String,
  //     required: true,
  //     unique: true,
  // },
  device_unique_id: {
    type: String,
    required: true,
  },
  device_name: {
    type: String,
  },
  sessions :[
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SessionSchema",
    },
  ], 
  
});

module.exports = mongoose.model("DeviceSchema", DeviceSchema);
