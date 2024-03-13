import mongoose from "mongoose";

const DeviceSchema = new mongoose.Schema({
  device_unique_id: {
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
  device_name: {
    type: String,
    required: true,
  },
  trip: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Trips",
      },
    ]
  },
});

export default mongoose.model("Devices", DeviceSchema);
