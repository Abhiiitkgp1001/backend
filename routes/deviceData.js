import express from "express";
import {
  getAllBMSIcs,
  getAllIcSeries,
  getAllTripByUser,
  getAllTrips,
  // postCreateSession,
  // postSessionBmsData,
  postCreateBatteryPack,
  // getAllDevices,
  // getDeviceSessions,
  // getSessionData,
  // getSessions,
  postCreateBmsIc,
  postCreateDevice,
  postCreateSeries,
  postCreateTrip,
  // postCreateSession,
  // postSessionBmsData,
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

// get routes for bmsic
router.get("/all_bms_ics", getAllBMSIcs);

// for crweating series routes
router.post("/create_series", postCreateSeries);
router.get("/get_all_ic_series", getAllIcSeries);

// trip routes
router.post("/create_trip", postCreateTrip);
router.get("/get_all_trips/:vehicle", getAllTrips);
router.get("/get_all_trips_user/:user", getAllTripByUser);

export default router;
