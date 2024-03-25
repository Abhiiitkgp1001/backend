import bcrypt from "bcryptjs";
import Address from "../models/address.js";
import Profile from "../models/profile.js";
import User from "../models/user.js";
import Vehicles from "../models/vehicle.js";
import { postData } from "../wrappers/postController.js";

const postLockAccount = async (req, res, next) => {
  postData(req, res, next, async (req, res, next, session) => {
    const pilotId = req.body.pilotId;
    let pilot = await User.findById(pilotId);
    pilot.lock_account = true;
    await pilot.save({ session: session });
    return {
      status: 201,
      data: {
        message: "Pilot Acount Locked",
      },
    };
  });
};

const postUnlockAccount = async (req, res, next) => {
  postData(req, res, next, async (req, res, next, session) => {
    const pilotId = req.body.pilotId;
    let pilot = await User.findById(pilotId);
    pilot.lock_account = false;
    await pilot.save({ session: session });
    return {
      status: 201,
      data: {
        message: "Pilot Acount Unlocked",
      },
    };
  });
};

const postCreatePilot = async (req, res, next) => {
  postData(req, res, next, async (req, res, next, session) => {
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
      profile = await profile.save({ session: session });
      pilot = new User({
        email: email,
        phone_number: phone_number,
        password: hashPass,
        admin: admin,
        profile: profile._id,
        childUsers: null,
      });
      pilot = await pilot.save({ session: session });
      profile.user = pilot._id;
      profile.save({ session: session });
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
    return {
      status: 201,
      dataa: {
        message: "Pilot Created successfully",
        user: pilot,
        profile: profile,
      },
    };
  });
};

const getAllPilots = async (req, res, next) => {
  postData(req, res, next, async (req, res, next, session) => {
    console.log("admin user id:", req.userId);
    let adminUser = await User.findById(req.userId).populate({
      path: "childUsers",
      populate: [
        {
          path: "profile",
        }, // Assuming 'profile' is a field in the 'User' model referencing the 'Profile' model
        {
          path: "pilotStats", // populate pilot stats
        },
      ],
    });
    let allPilots = adminUser.childUsers;
    console.log("all pilots", allPilots);
    return {
      status: 200,
      data: {
        pilots: allPilots,
      },
    };
  });
};

const removePilot = async (req, res, next) => {
  postData(req, res, next, async (req, res, next, session) => {
    const pilotId = req.params.pilotId;
    const pilot = await User.findByIdAndUpdate(
      { _id: pilotId },
      { archived: true },
      {
        session: session,
        new: true,
      }
    );
    //update linked pilots
    await Vehicles.updateOne(
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
    return {
      status: 200,
      data: {
        message: "Pilot removed successfully",
        adminUser: adminUser,
        removedPilot: pilot,
      },
    };
  });
};

//link vehicle to admin
const postAddVehicle = async (req, res, next) => {
  postData(req, res, next, async (req, res, next, session) => {
    // get vehicle information
    const registrationNumber = req.body.registrationNumber || null;
    const vehicleLoadType = req.body.vehicleLoadType;
    const vehicleWheelType = req.body.vehicleWheelType;
    const deviceId = req.body.deviceId || null;
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
        req.userId,
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
      return {
        status: 201,
        data: {
          message: "vehicle added",
          adminUser: adminUser,
          addedVehicle: vehicle,
        },
      };
    }
  });
};

const deleteVehicle = async (req, res, next) => {
  postData(req, res, next, async (req, res, next, session) => {
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
    return {
      status: 201,
      data: {
        message: "linked vehicle removed",
        adminUser: adminUser,
        deletedVehicle: vehicle,
      },
    };
  });
};

//get all vehicles for an admin
const getAllVehicles = async (req, res, next) => {
  postData(req, res, next, async (req, res, next, session) => {
    let allVehicles = await User.findById(req.userId).populate({
      path: "addedVehicles",
      populate: {
        path: "device",
        path: "linkedPilots", // Assuming 'deviceId' is a field in the 'User' model referencing the 'Devices' model
      },
    });
    return {
      status: 200,
      data: {
        vehicles: allVehicles.addedVehicles,
      },
    };
  });
};

const postAssignPilot = async (req, res, next) => {
  postData(req, res, next, async (req, res, next, session) => {
    //userID and vehicle ID
    const pilotId = req.body.userId;
    const vehicleId = req.body.vehicleId;
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
    return {
      status: 201,
      data: {
        message: "Pilot assigned successfully",
        vehicle: vehicle,
        pilot: pilot,
      },
    };
  });
};

const postRemoveAssignedPilot = async (req, res, next) => {
  postData(req, res, next, async (req, res, next, session) => {
    const pilotId = req.body.userId;
    const vehicleId = req.body.vehicleId;
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
    return {
      status: 204,
      data: {
        message:
          "Vehicle with ID " +
          vehicleId +
          " removed successfully from linkedPilot",
        updatedPilot: pilot,
        updatedVehicle: vehicle,
      },
    };
  });
};


const createVehicle = async (req, res, next) => {
  
}

export {
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
};
