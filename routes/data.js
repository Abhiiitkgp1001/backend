import express from "express";
import {
  getAllDevices,
  getDeviceSessions,
  getSessionData,
  getSessions,
  postCreateSession,
  postSessionBmsData,
} from "../controllers/data_controllers.js";
import apiAuth from "../middlewares/apiEndPointAuth.js";

const router = express.Router();

//fetch session data
router.get("/get_all_sessions", apiAuth, getSessions);

router.get("/get_session_data", apiAuth, getSessionData);

router.get("/get_all_devices", apiAuth, getAllDevices);

router.get("/get_device_all_sessions/:device_id", apiAuth, getDeviceSessions);

// post route for data sendings
router.post("/session_bms_data", apiAuth, postSessionBmsData);

router.post("/create_session", apiAuth, postCreateSession);

export default router;
