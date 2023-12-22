const express = require("express");
const User = require("../models/user");
const { body } = require("express-validator");
const adminController = require("../controllers/adminController");
const router = express.Router();
const isAuth = require("../middlewares/auth");
const apiAuth = require("../middlewares/apiEndPointAuth");
const isAdmin = require("../middlewares/admin");

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
    adminController.deletePilot
  );

module.exports = router;
