import express from "express";

import {
  createVehicle,
  mergeDeviceWithVehicle,
  updateVehicle,
} from "../controllers/manufacturerController.js";

const router = express.Router();

router.post("/create_vehicle", createVehicle);
router.post("/update_vehicle", updateVehicle);
router.post("/merge_device_vehicle", mergeDeviceWithVehicle);

export default router;
