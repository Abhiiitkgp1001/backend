import mongoose from "mongoose";

const BmsSchema = new mongoose.Schema({
  bmsUniqueId: {
    type: String,
    required: true
  },
  isMaster: {
    type: Boolean,
    default: false,
  },
  batteryPack: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BatteryPacks",
    default: null
  },
  bmsName: {
    type: String,
    default: "BMS",
  },
  device: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Devices",
    default: null
  },
  cells: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Cells",
      },
    ],
    default: []
  },
  current: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Currents",
    },
    ],
    default: []
  },
  temperatureSensors: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref:"TemperatureSensors"
      }
    ],
    default: []
  }
});

export default mongoose.model("BmsIcs", BmsSchema);
