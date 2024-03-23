import express from "express";
import {
  // postCreateSession,
  // postSessionBmsData,
  postCreateBatteryPack,
  // getAllDevices,
  // getDeviceSessions,
  // getSessionData,
  // getSessions,
  postCreateBmsIc,
  postCreateDevice,
  postMergeBatteryPackAndBmsIcs,
  postMergeDeviceWithBatteryPack,
} from "../controllers/deviceDataControllers.js";

const router = express.Router();

// //fetch session data
// router.get("/get_all_sessions", apiAuth, getSessions);

// router.get("/get_session_data", apiAuth, getSessionData);

// router.get("/get_all_devices", apiAuth, getAllDevices);

// router.get("/gpostCreateBatteryPack, getDeviceSessions);

// // post route for data sendings
// router.post("/session_bms_data", apiAuth, postSessionBmsData);

// router.post("/create_session", apiAuth, postCreateSession);

router.post("/create_bmsic", postCreateBmsIc);
router.post("/create_battery_pack", postCreateBatteryPack);
router.post("/merge_battery_pack_bmsic", postMergeBatteryPackAndBmsIcs);
router.post("/create_device", postCreateDevice);
router.post("/merge_device_batteryPack", postMergeDeviceWithBatteryPack);

export default router;
