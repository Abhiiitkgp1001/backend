import Address from "../models/address.js";
import Device from "../models/device.js";
import PilotStat from "../models/pilot_stats.js";
import Profile from "../models/profile.js";
import User from "../models/user.js";
import Vehicles from "../models/vehicle.js";

const createDevices = async (req, res, next) => {
  let data = req.body;
  for (let i = 0; i < data.length; i++) {
    let device = {
      device_unique_id: data[i].device_unique_id,
      device_name: data[i].device_name,
    };
    const savedDevice = new Device(device);
    await savedDevice.save();
  }
  res.status(200).json({ msg: "devices saved" });
};

const addVechiles = async (req, res, next) => {
  let data = req.body;
  let allVechiles = [];
  for (let i = 0; i < data.length; i++) {
    let vechile = {
      registrationNumber: data[i].registrationNumber,
      vehicleLoadType: data[i].vehicleLoadType,
      vehicleWheelType: data[i].vehicleWheelType,
      device: data[i].device,
      vehicleName: data[i].vehicleName,
      modelName: data[i].modelName,
      chassisNumber: data[i].chassisNumber,
      ownerName: data[i].ownerName,
      kmDriven: data[i].kmDriven,
      fuelSaved: data[i].fuelSaved,
      co2Reduced: data[i].co2Reduced,
      purchaseDate: data[i].purchaseDate,
      vehiclePhoto: data[i].vehiclePhoto,
      user: "65da0312bbd024aa52eab803",
    };
    let savedVechile = new Vehicles(vechile);
    savedVechile = await savedVechile.save();
    allVechiles.push(savedVechile._id);
  }
  await User.findByIdAndUpdate("65da0312bbd024aa52eab803", {
    $push: { addedVehicles: { $each: allVechiles } },
  });
  res.status(200).json({ msg: "vechiles saved" });
};

const addStats = async (req, res, next) => {
  let data = req.body["users"];
  let data2 = req.body["stats"];
  let allPilots = [];
  for (let i = 0; i < data.length; i++) {
    let address = new Address({});
    await address.save();
    let working_address = new Address({});
    await working_address.save();
    let profile = new Profile({
      email: data[i].email,
      phone_number: data[i].phone_number,
      address: address._id,
      working_address: working_address._id,
    });
    await profile.save();
    let pilot = {
      email: data[i].email,
      password: data[i].password,
      phone_number: data[i].phone_number,
      admin: data[i].admin,
      accountLock: data[i].accountLock,
      profile: profile,
    };
    let savedUser = new User(pilot);
    savedUser = await savedUser.save();
    allPilots.push(savedUser._id);
    let stats = {
      driverRating: data2[i].driverRating,
      online: data2[i].online,
      drivingFlag: data2[i].drivingFlag,
      warningFlag: data2[i].warningFlag,
      kmDriven: data2[i].kmDriven,
      fuelSaved: data2[i].fuelSaved,
      co2Reduced: data2[i].co2Reduced,
      user: savedUser._id,
    };
    let pilot_stats = new PilotStat(stats);
    pilot_stats = await pilot_stats.save();
    savedUser.pilotStats = pilot_stats._id;
    await savedUser.save();
  }
  await User.findByIdAndUpdate("65da0312bbd024aa52eab803", {
    $push: { childUsers: { $each: allPilots } },
  });
  res.status(200).json({ msg: "pilots saved" });
};

const addPilots = async (req, res, next) => {
  let user = await User.findById("65da0312bbd024aa52eab803");
  let users = await User.find({ admin: false });
  for (let i = 0; i < users.length; i++) {
    user.childUsers.push(users[i]._id);
  }
  await user.save();
  res.status(200).json({ msg: "users saved" });
};

export { addPilots, addStats, addVechiles, createDevices };
