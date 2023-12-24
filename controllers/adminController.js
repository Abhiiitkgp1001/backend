const Profile = require("../models/profile");
const { validationResult } = require("express-validator");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mailer = require("../utils/sendEmail");
const crypto = require("crypto");
const redisClient = require("../utils/redisClient");
const UserDto = require("../dtos/user.dto");

exports.postLockAccount = (req, res, next) => {
  const pilotId = req.body.pilotId;
  User.findById(req.pilotId)
    .then((pilot) => {
      pilot.lock_account = true;
      return pilot.save();
    })
    .then((savedPilot) => {
      res.status(200).json({
        message: "Pilot Acount Locked",
      });
    })
    .catch((err) => {
      err.statusCode = err.statusCode || 500;
      next(err);
    });
};

exports.postUnlockAccount = (req, res, next) => {
  const pilotId = req.body.pilotId;
  User.findById(req.pilotId)
    .then((pilot) => {
      pilot.lock_account = false;
      return pilot.save();
    })
    .then((savedPilot) => {
      res.status(200).json({
        message: "Pilot Acount Unlocked",
      });
    })
    .catch((err) => {
      err.statusCode = err.statusCode || 500;
      next(err);
    });
};

exports.postCreatePilot = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = new Error("Validation Failed");
    err.statusCode = 409;
    err.data = errors.array();
    throw err;
  }
  const email = req.body.email;
  const phone_number = req.body.phone_number;
  const password = req.body.password;
  const admin = req.body.admin;
  let hashPass;
  let loadedUser;
  let pilot;
  // check if user ssigned in is admin else it should not be able to create pilot
  // get user by admin user id
  User.findById(req.userId)
    .then((user) => {
      loadedUser = user;
      // check if pilot allready exists
      return User.findOne({ email: email });
    })
    .then((user) => {
      if (!user) {
        return bcrypt.hash(password, 12);
      } else {
        const err = new Error("User already exists");
        err.statusCode = 400;
        throw err;
      }
    })
    .then((hash) => {
      hashPass = hash;
      const profile = new Profile();
      return profile.save();
    })
    .then((profile) => {
      const pilot = new User({
        email: email,
        phone_number: phone_number,
        password: hashPass,
        admin: admin,
        profile: profile._id,
        childUsers: null,
      });
      // Generate a unique reset token
      return pilot.save();
    })
    .then((savedPilot) => {
      pilot = savedPilot;
      console.log("Pilot created successfully ", savedPilot);
      loadedUser.childUsers.push(savedPilot._id);
      return loadedUser.save();
    })
    .then((user) => {
      res.status(201).json({
        message: "Pilot Created successfully",
        user: pilot,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.getAllPilots = (req, res, next) => {
  //   console.log("getAllPilots");
  User.findById(req.userId)
    .then((user) => {
      return user.populate({
        path: "childUsers",
        populate: [{ path: "profile" }],
      });
    })
    .then((user_populated) => {
      const allPilots = user_populated.childUsers;
      allPilots = allPilots.filter((pilot) => pilot.archived);
      res.status(200).json({
        pilots: allPilots,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.removePilot = (req, res, next) => {
  const pilotId = req.params.pilotId;
  User.findByIdAndUpdate({ _id: pilotId }, { archived: true })
    .then((pilot) => {
      console.log("Pilot Archived successfully", pilot);
      // admin user update its child removed
      res.status(200).json({
        message: "Pilot removed successfully",
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
