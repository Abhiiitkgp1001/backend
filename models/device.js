import mongoose from "mongoose";

const DeviceSchema = new mongoose.Schema({
  deviceUniqueId: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    default: null,
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vehicles",
    default: null,
  },
  deviceName: {
    type: String,
    required: true,
  },
  trip: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Trips",
      },
    ],
  },
  batteryPack: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BatteryPacks",
  },
});

export default mongoose.model("Devices", DeviceSchema);
