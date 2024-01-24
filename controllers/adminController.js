const Profile = require("../models/profile");
const { validationResult } = require("express-validator");
const User = require("../models/user");
const Vehicles = require("../models/vehicle");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mailer = require("../utils/sendEmail");
const crypto = require("crypto");
const redisClient = require("../utils/redisClient");
const UserDto = require("../dtos/user.dto");
const { throws } = require("assert");

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
  let loadedProile;
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
      const profile = new Profile({ email: email, phone_number: phone_number });
      return profile.save();
    })
    .then((profile) => {
      loadedProile = profile;
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
        profile: loadedProile,
        // populate profile
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
        populate: {
          path: "profile", // Assuming 'profile' is a field in the 'User' model referencing the 'Profile' model
        },
      });
    })
    .then((user_populated) => {
      let allPilots = user_populated.childUsers;
      allPilots = allPilots.filter((pilot) => pilot.archived === false);
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
  let removedPilot;
  User.findByIdAndUpdate({ _id: pilotId }, { archived: true })
    .then((pilot) => {
      removedPilot = pilot;
      console.log("Pilot Archived successfully", pilot);
      // admin user update its child removed
      // return User.updateOne({ _id: req.userId,  })
      return User.findByIdAndUpdate(
        { _id: req.userId },
        {
          $pull: { childUsers: pilotId },
        },
        {
          new: true,
        }
      ).populate({
        path: ["childUsers", "addedVehicles"],
      });
    })
    .then((adminUser) => {
      res.status(200).json({
        message: "Pilot removed successfully",
        adminUsser: adminUser,
        removedPilot: removedPilot,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

// vehicle linkings

//link vehicle to admin
exports.postAddVehicle = (req, res, next) => {
  // get vehicle information
  const registrationNumber = req.body.registrationNumber || null;
  const vehicleLoadType = req.body.vehicleLoadType;
  const vehicleWheelType = req.body.vehicleWheelType;
  const deviceId = req.body.deviceId || null;
  console.log(registrationNumber, vehicleLoadType, vehicleWheelType, deviceId);
  //get current adim user and then create vehicle and then update vehicle

  let savedVehicle;
  Vehicles;
  Vehicles.findOne({ registrationNumber: registrationNumber })
    .then((vehicle) => {
      if (vehicle) {
        if (vehicle.archived) {
          vehicle.archived = false;
          vehicle.deviceId = deviceId; // device can be replaced if device is malfunctioned
          return vehicle.save();
        }
        const error = new Error(
          "Vehicle allready exists for other user so cant be added"
        );
        error.statusCode = 409;
        throw error;
      }
      vehicle = new Vehicles({
        registrationNumber: registrationNumber,
        vehicleWheelType: vehicleWheelType,
        deviceId: deviceId,
        vehicleLoadType: vehicleLoadType,
      });
      return vehicle.save();
    })
    .then((vehicle) => {
      savedVehicle = vehicle;
      return User.findById(req.userId);
    })
    .then((adminUser) => {
      adminUser.addedVehicles.push(savedVehicle._id);
      return adminUser.save();
    })
    .then((adminUser) => {
      return User.findById(adminUser._id).populate([
        {
          path: "childUsers",
          populate: {
            path: "profile", // Assuming 'profile' is a field in the 'User' model referencing the 'Profile' model
          },
        },
        {
          path: "addedVehicles",
          populate: {
            path: "vehicles",
          },
        },
      ]);
    })
    .then((adminUser) => {
      res.status(201).json({
        message: "vehicle added",
        adminUser: adminUser,
        addedVehicle: savedVehicle,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.deleteVehicle = (req, res, next) => {
  // get vehicleId
  let updatedVehicle;
  const vehicleId = req.params.vehicleId;
  Vehicles.findByIdAndUpdate(vehicleId, { archived: true })
    .then((vehicleUpdated) => {
      updatedVehicle = vehicleUpdated;
      return User.findById(req.userId);
    })
    .then((adminUser) => {
      adminUser.addedVehicles.pop(vehicleId);
      return adminUser.save();
    })
    .then((adminUser) => {
      return User.updateOne(
        { _id: vehicleId, childUsers: { $in: adminUser.childUsers } },
        { $pull: { "childUsers.$[].allowedVehicles": vehicleId } }
      );
    })
    .then((result) => {
      console.log(`${result.nModified} document(s) updated`);
      return User.findById(req.userId);
    })
    .then((adminUser) => {
      res.status(200).json({
        message: "linked vehicle removed",
        adminUser: adminUser,
        deletedVehicle: updatedVehicle,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

//get all vehicles for an admin
exports.getAllVehicles = (req, res, next) => {
  //   console.log("getAllPilots");
  User.findById(req.userId)
    .then((user) => {
      return user.populate({
        path: "addedVehicles",
        populate: {
          path: "deviceId",
          path: "linkedPilots", // Assuming 'deviceId' is a field in the 'User' model referencing the 'Devices' model
        },
      });
    })
    .then((user_populated) => {
      let allVehicles = user_populated.addedVehicles;
      // allVehicles = allVehicles.filter((vehicle) => pilot.archived === false);
      res.status(200).json({
        vehicles: allVehicles,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
