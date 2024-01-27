const express = require("express");
const User = require("../models/user");
const { body } = require("express-validator");
const adminController = require("../controllers/adminController");
const router = express.Router();
const isAuth = require("../middlewares/auth");
const apiAuth = require("../middlewares/apiEndPointAuth");
const isAdmin = require("../middlewares/isAdmin");

router.post(
  "/lock_account",
  apiAuth,
  isAuth,
  isAdmin,
  adminController.postLockAccount
);
router.post(
  "/unlock_account",
  apiAuth,
  isAuth,
  isAdmin,
  adminController.postUnlockAccount
);

router.post(
  "/create_pilot",
  apiAuth,
  isAuth,
  isAdmin,
  adminController.postCreatePilot
);

router.get(
  "/get_all_pilots",
  apiAuth,
  isAuth,
  isAdmin,
  adminController.getAllPilots
);

router.delete(
  "/remove_pilot/:pilotId",
  apiAuth,
  isAuth,
  isAdmin,
  adminController.removePilot
);

router.post(
  "/add_vehicle",
  apiAuth,
  isAuth,
  isAdmin,
  adminController.postAddVehicle
);

router.get(
  "/get_all_vehicles",
  apiAuth,
  isAuth,
  isAdmin,
  adminController.getAllVehicles
);

router.delete(
  "/delete_vehicle/:vehicleId",
  apiAuth,
  isAuth,
  isAdmin,
  adminController.deleteVehicle
);

router.post(
  "/assgin_pilot",
  apiAuth,
  isAuth,
  isAdmin,
  adminController.postAssignPilot
);

router.post(
  "/remove_asigned_pilot",
  apiAuth,
  isAuth,
  isAdmin,
  adminController.postRemoveAssignedPilot
);
module.exports = router;
