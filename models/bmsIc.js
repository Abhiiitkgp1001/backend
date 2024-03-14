import mongoose from "mongoose";

const BmsSchema = new mongoose.Schema({
  isMaster: {
    type: Boolean,
    default: false,
  },
  batteryPack: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BatteryPacks",
  },
  bmsName: {
    type: String,
    default: "BMS",
  },
  device: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Devices",
  },
  cells: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Cells",
      },
    ],
  },
  current: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Currents",
    }
  ]
  },
  temperatureSensors: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref:"TemperatureSensors"
      }
    ]
  }
});

export default mongoose.model("BmsIcs", BmsSchema);
