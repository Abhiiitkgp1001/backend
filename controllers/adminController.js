const mongoose = require("mongoose");
const Profile = require("../models/profile");
const Address = require("../models/address");
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

exports.postCreatePilot = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
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
    let profile;
    const adminUser = await User.findById(req.userId);
    let pilot = await User.findOne({
      $or: [{ email: email }, { phone_number: phone_number }],
    });
    if (!pilot) {
      hashPass = await bcrypt.hash(password, 12);
      //create two addresses for profile
      const address = new Address({});
      const working_address = new Address({});

      profile = new Profile({
        email: email,
        phone_number: phone_number,
        address: address._id,
        working_address: working_address._id,
      });
      console.log(profile._id);
      await profile.save({ session: session });
      pilot = new User({
        email: email,
        phone_number: phone_number,
        password: hashPass,
        admin: admin,
        profile: profile._id,
        childUsers: null,
      });
      pilot = await pilot.save({ session: session });
      adminUser.childUsers.push(pilot._id);
      address.user = pilot._id;
      address.profile = profile._id;
      working_address.user = pilot._id;
      working_address.profile = profile._id;
      await address.save({ session: session });
      await working_address.save({ session: session });
      adminUser = await adminUser.save({ session: session, new: true });
    } else {
      if (pilot.archived) {
        pilot.archived = false;
        hashPass = await bcrypt.hash(password, 12);
        pilot.password = hashPass;
        pilot.email = email;
        pilot.phone_number = phone_number;
        pilot = await pilot.save({ session: session, new: true });
        adminUser.childUsers.push(pilot._id);
        adminUser = await adminUser.save({ session: session, new: true });
      } else {
        const err = new Error("Pilot already exists");
        err.statusCode = 400;
        throw err;
      }
    }
    // If all documents are successfully created, commit the transaction
    if (session.transaction != null && session.inTransaction()) {
      await session.commitTransaction();
    }
    await session.endSession();
    res.status(201).json({
      message: "Pilot Created successfully",
      user: pilot,
      profile: profile,
    });
  } catch (err) {
    console.log(`Error while creating new User ${err}`);
    // If an error occurs, abort the transaction and handle the error
    try {
      if (session.transaction != null && session.inTransaction()) {
        await session.abortTransaction();
      }
      await session.endSession();
      console.error("Transaction aborted:", err);
    } catch (abortError) {
      // Handle the case where aborting the transaction fails
      console.error("Error aborting transaction:", abortError);
    }
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
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

exports.removePilot = async (req, res, next) => {
  const pilotId = req.params.pilotId;
  const session = await mongoose.startSession();
  try {
    //archive user
    session.startTransaction();
    const pilot = await User.findByIdAndUpdate(
      { _id: pilotId },
      { archived: true },
      {
        session: session,
        new: true,
      }
    );
    //update linked pilots
    const updatedVehicles = await Vehicles.updateOne(
      { _id: adminUser._id, addedVehicles: { $in: adminUser.addedVehicles } },
      { $pull: { "addedVehicles.$[].linkedPilots": pilotId } },
      {
        session: session,
        new: true,
      }
    );
    //update child users
    const adminUser = await User.findByIdAndUpdate(
      { _id: req.userId },
      {
        $pull: { childUsers: pilotId },
      },
      {
        session: session,
        new: true,
      }
    ).populate({
      path: ["childUsers", "addedVehicles"],
    });
    // If all documents are successfully created, commit the transaction
    if (session.transaction != null && session.inTransaction()) {
      await session.commitTransaction();
    }
    await session.endSession();
    res.status(200).json({
      message: "Pilot removed successfully",
      adminUser: adminUser,
      removedPilot: pilot,
    });
  } catch (err) {
    // If an error occurs, abort the transaction and handle the error
    try {
      if (session.transaction != null && session.inTransaction()) {
        await session.abortTransaction();
      }
      await session.endSession();
      console.error("Transaction aborted:", err);
    } catch (abortError) {
      // Handle the case where aborting the transaction fails
      console.error("Error aborting transaction:", abortError);
    }
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// vehicle linkings

//link vehicle to admin
exports.postAddVehicle = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    // get vehicle information
    const registrationNumber = req.body.registrationNumber || null;
    const vehicleLoadType = req.body.vehicleLoadType;
    const vehicleWheelType = req.body.vehicleWheelType;
    const deviceId = req.body.deviceId || null;
    console.log(
      registrationNumber,
      vehicleLoadType,
      vehicleWheelType,
      deviceId
    );
    let adminUser;
    //get current adim user and then create vehicle and then update vehicle
    let vehicle = await Vehicles.findOne({
      registrationNumber: registrationNumber,
    });
    if (vehicle) {
      if (vehicle.archived) {
        vehicle.archived = false;
        vehicle.device = deviceId; // device can be replaced if device is malfunctioned
        vehicle.vehicleWheelType = vehicleWheelType;
        vehicle.vehicleLoadType = vehicleLoadType;
        vehicle = await vehicle.save({
          session: session,
          new: true, // Optional: Returns the updated document after update
        });
      } else {
        const error = new Error(
          "Vehicle allready exists for other so Vehicle cant be added"
        );
        error.statusCode = 409;
        throw error;
      }
    } else {
      vehicle = new Vehicles({
        registrationNumber: registrationNumber,
        vehicleWheelType: vehicleWheelType,
        device: deviceId,
        vehicleLoadType: vehicleLoadType,
      });
      adminUser = await User.findByIdAndUpdate(
        vehicle._id,
        {
          $push: { addedVehicles: vehicle._id },
        },
        {
          session: session,
          new: true, // Optional: Returns the updated document after update
        }
      ).populate([
        {
          path: "childUsers",
          populate: {
            path: "profile", // Assuming 'profile' is a field in the 'User' model referencing the 'Profile' model
            path: "allowedVehicles",
          },
        },
        {
          path: "addedVehicles",
          populate: {
            path: "linkedPilots",
          },
        },
      ]);
      vehicle = await vehicle.save({ sessionId: session, new: true });
    }

    if (session.transaction != null && session.inTransaction()) {
      await session.commitTransaction();
    }
    await session.endSession();
    res.status(201).json({
      message: "vehicle added",
      adminUser: adminUser,
      addedVehicle: vehicle,
    });
  } catch (err) {
    // If an error occurs, abort the transaction and handle the error
    try {
      if (session.transaction != null && session.inTransaction()) {
        await session.abortTransaction();
      }
      await session.endSession();
      console.error("Transaction aborted:", err);
    } catch (abortError) {
      // Handle the case where aborting the transaction fails
      console.error("Error aborting transaction:", abortError);
    }
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.deleteVehicle = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    let vehicle = await Vehicles.findByIdAndUpdate(
      req.params.vehicleId,
      { archived: true },
      { session: session, new: true }
    );

    let adminUser = await User.findByIdAndUpdate(
      req.userId,
      {
        $pull: { addedVehicles: req.params.vehicleId },
      },
      { session: session, new: true }
    );

    adminUser = await User.findByIdAndUpdate(
      adminUser._id,
      { childUsers: { $in: adminUser.childUsers } },
      { $pull: { "childUsers.$[].allowedVehicles": req.params.vehicleId } },
      { session: session, new: true }
    ).populate({
      path: ["childUsers", "addedVehicles"],
    });

    if (session.transaction != null && session.inTransaction()) {
      await session.commitTransaction();
    }
    await session.endSession();
    res.status(200).json({
      message: "linked vehicle removed",
      adminUser: adminUser,
      deletedVehicle: vehicle,
    });
  } catch (err) {
    // If an error occurs, abort the transaction and handle the error
    try {
      if (session.transaction != null && session.inTransaction()) {
        await session.abortTransaction();
      }
      await session.endSession();
      console.error("Transaction aborted:", err);
    } catch (abortError) {
      // Handle the case where aborting the transaction fails
      console.error("Error aborting transaction:", abortError);
    }
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

//get all vehicles for an admin
exports.getAllVehicles = (req, res, next) => {
  //   console.log("getAllPilots");
  User.findById(req.userId)
    .then((user) => {
      return user.populate({
        path: "addedVehicles",
        populate: {
          path: "device",
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

exports.postAssignPilot = async (req, res, next) => {
  //userID and vehicle ID
  const pilotId = req.body.userId;
  const vehicleId = req.body.vehicleId;
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    let vehicle = await Vehicles.findById(vehicleId);
    if (vehicle === null) {
      const error = new Error("Vehicle doesnt  exist! ");
      error.statusCode = 403;
      throw error;
    }
    let pilot = await User.findById(pilotId);
    if (pilot === null) {
      const error = new Error("Pilot doesnt  exist! ");
      error.statusCode = 403;
      throw error;
    }
    pilot.allowedVehicles.push(vehicle._id);
    vehicle.linkedPilots.push(pilot._id);
    pilot = await pilot.save({ session: session, new: true });
    vehicle = await vehicle.save({ session: session, new: true });

    if (session.transaction != null && session.inTransaction()) {
      await session.commitTransaction();
    }
    await session.endSession();
    res.status(201).json({
      message: "Pilot assigned successfully",
      vehicle: vehicle,
      pilot: pilot,
    });
  } catch (err) {
    // If an error occurs, abort the transaction and handle the error
    try {
      if (session.transaction != null && session.inTransaction()) {
        await session.abortTransaction();
      }
      await session.endSession();
      console.error("Transaction aborted:", err);
    } catch (abortError) {
      // Handle the case where aborting the transaction fails
      console.error("Error aborting transaction:", abortError);
    }
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.postRemoveAssignedPilot = async (req, res, next) => {
  const pilotId = req.body.userId;
  const vehicleId = req.body.vehicleId;
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const pilot = await User.findByIdAndUpdate(
      pilotId,
      {
        $pull: { allowedVehicles: vehicleId },
      },
      { session: session, new: true }
    );
    const vehicle = await Vehicles.findByIdAndUpdate(
      vehicleId,
      {
        $pull: { linkedPilots: pilotId },
      },
      { session: session, new: true }
    );
    if (session.transaction != null && session.inTransaction()) {
      await session.commitTransaction();
    }
    await session.endSession();
    res.status(204).json({
      message:
        "Vehicle with ID " +
        vehicleId +
        " removed successfully from linkedPilot",
      updatedPilot: pilot,
      updatedVehicle: vehicle,
    });
  } catch (err) {
    // If an error occurs, abort the transaction and handle the error
    try {
      if (session.transaction != null && session.inTransaction()) {
        await session.abortTransaction();
      }
      await session.endSession();
      console.error("Transaction aborted:", err);
    } catch (abortError) {
      // Handle the case where aborting the transaction fails
      console.error("Error aborting transaction:", abortError);
    }
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
