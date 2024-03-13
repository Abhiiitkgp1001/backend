import express from "express";
import {
  deleteVehicle,
  getAllPilots,
  getAllVehicles,
  postAddVehicle,
  postAssignPilot,
  postCreatePilot,
  postLockAccount,
  postRemoveAssignedPilot,
  postUnlockAccount,
  removePilot,
} from "../controllers/adminController.js";
import apiAuth from "../middlewares/apiEndPointAuth.js";
import { isAuth } from "../middlewares/auth.js";
import { isAdmin } from "../middlewares/isAdmin.js";

const router = express.Router();
router.post("/lock_account", apiAuth, isAuth, isAdmin, postLockAccount);
router.post("/unlock_account", apiAuth, isAuth, isAdmin, postUnlockAccount);

router.post("/create_pilot", apiAuth, isAuth, isAdmin, postCreatePilot);

router.get("/get_all_pilots", apiAuth, isAuth, isAdmin, getAllPilots);

router.delete("/remove_pilot/:pilotId", apiAuth, isAuth, isAdmin, removePilot);

router.post("/add_vehicle", apiAuth, isAuth, isAdmin, postAddVehicle);

router.get("/get_all_vehicles", apiAuth, isAuth, isAdmin, getAllVehicles);

router.delete(
  "/delete_vehicle/:vehicleId",
  apiAuth,
  isAuth,
  isAdmin,
  deleteVehicle
);

router.post("/assgin_pilot", apiAuth, isAuth, isAdmin, postAssignPilot);

router.post(
  "/remove_asigned_pilot",
  apiAuth,
  isAuth,
  isAdmin,
  postRemoveAssignedPilot
);
export default router;
