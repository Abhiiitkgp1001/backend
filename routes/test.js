import express from "express";
import {
  addPilots,
  addStats,
  addVechiles,
  createDevices,
} from "../controllers/test.js";
const router = express.Router();

router.post("/addPilots", addPilots);
router.post("/addStats", addStats);
router.post("/addVechiles", addVechiles);
router.post("/createDevices", createDevices);

export default router;
