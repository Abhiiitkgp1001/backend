// import bcrypt from "bcryptjs";
// import Address from "../models/address.js";
// import Profile from "../models/profile.js";
// import User from "../models/user.js";
import Device from "../models/device.js";
import Vehicles from "../models/vehicle.js";
import { postData } from "../wrappers/postController.js";

const createVehicle = async (req, res, next) => {
  const body = async (req, res, next, session) => {
    let vehicle = new Vehicles({
      vehicleLoadType: req.body.vehicleLoadType,
      vehicleWheelType: req.body.vehicleWheelType,
      device: null,
      chassisNumber: req.body.chassisNumber,
      modelName: req.body.modelName,
      vehicleName: req.body.vehicleName,
      archived: false,
    });

    vehicle = await vehicle.save({ session: session, new: true });
    return {
      status: 201,
      data: {
        message: "Vehicle Created Successfully",
        vehicle: vehicle,
      },
    };
  };
  postData(req, res, next, body);
};

const updateVehicle = async (req, res, next) => {
  const body = async (req, res, next, session) => {
    const obj = {};
    if (req.body.vehicleLoadType) {
      obj.vehicleLoadType = req.body.vehicleLoadType;
    }
    if (req.body.vehicleWheelType) {
      obj.vehicleWheelType = req.body.vehicleWheelType;
    }
    if (req.body.deviceId) {
      obj.device = req.body.deiceId;
    }
    if (req.body.chassisNumber) {
      obj.chassisNumber = req.body.chassisNumber;
    }
    if (req.body.modelName) {
      obj.modelName = req.body.modelName;
    }
    if (req.body.vehicleName) {
      obj.vehicleName = req.body.vehicleName;
    }
    const vehicle = Vehicles.findByIdAndUpdate(req.params.vehicleId, obj, {
      session: session,
      new: true,
    });
    return {
      status: 202,
      data: {
        message: "Vehicle Updated Successfully",
        vehicle: vehicle,
      },
    };
  };
  postData(req, res, next, body);
};

const mergeDeviceWithVehicle = async (req, res, next) => {
  // check if Vehicle exists or not
  const body = async (req, res, next, session) => {
    let vehicle = await Vehicles.findById(req.body.vehicleId);
    if (!vehicle) {
      const error = new Error(`Vehicle not found  for given ID ${req.body.id}`);
      error.statusCode = 404;
      throw error;
    } else {
      // check if Device Exixts or not
      let device = await Device.findById(req.body.deviceId);
      if (!device) {
        const error = new Error(
          `Device not found  for given ID ${req.body.id}`
        );
        error.statusCode = 404;
        throw error;
      } else {
        vehicle.device = device._id;
        vehicle = await vehicle.save({ session: session, new: true });
        return {
          status: 202,
          data: {
            message: "Device Merged With Vehicle Successfully",
            vehicle: vehicle,
          },
        };
      }
    }
  };
  postData(req, res, next, body);
};

export { createVehicle, mergeDeviceWithVehicle, updateVehicle };
