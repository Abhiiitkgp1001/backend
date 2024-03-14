import mongoose from "mongoose";

const batteryPackSchema = mongoose.Schema({
  batteryPackUniqueId: {
    type: String,
    default: "",
  },
  bmsIc: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BmsIcs",
      },
    ],
  },
  cellChemistry: {
    type: String,
    default: "",
  },
  manufacturer: {
    type: String,
    default: "",
  },
  maxVoltage: {
    type: Number,
    default: 0,
  },
  minVoltage: {
    type: Number,
    default: 0,
  },
  power: {
    type: Number,
    default: 0,
  },
  capacity: {
    type: Number,
    default: 0,
  },
  ratedCurrent: {
    type: Number,
    default: 0,
  },
  maxCurrent: {
    type: Number,
    default: 0,
  },
  maxTemperature: {
    type: Number,
    default: 0,
  },
  soc: {
    type: Number,
    default: 0,
  },
  soh: {
    type: Number,
    default: 0,
  },
  chargeCycle: {
    type: Number,
    default: 0,
  },
  currentPackCapacity: {
    type: Number,
    default: 0,
  },
  maxPowerDelivery: {
    type: Number,
    default: 0,
  },
});

export default mongoose.model("BatteryPacks", batteryPackSchema);
