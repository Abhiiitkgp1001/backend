const mongoose = require("mongoose");

const DeviceSchema = new mongoose.Schema({
  device_unique_id: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserSchema",
    default: null,
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vehicles",
    default: null,
  },
  device_name: {
    type: String,
    required: true,
  },
  sessions: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SessionSchema",
      },
    ],
  },
});

module.exports = mongoose.model("DeviceSchema", DeviceSchema);
