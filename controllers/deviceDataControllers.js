import BatteryPack from "../models/BatteryPack.js";
import BmsIc from "../models/bmsIc.js";
import Cell from "../models/cells.js";
import Device from "../models/device.js";
import TemperatureSensor from "../models/temperatureSensors.js";
import { postData } from "../wrappers/postController.js";

const initBmsIc = async (
  bmsUniqueId,
  isMaster,
  bmsName,
  noOfCells,
  noOfTemperatureSensors,
  session
) => {
  let bmsIc = new BmsIc({
    isMaster: isMaster,
    bmsUniqueId: bmsUniqueId,
    bmsName: bmsName,
  });

  bmsIc = await bmsIc.save({ new: true }, { session });
  let cells = [];
  for (let i = 0; i < noOfCells; i++) {
    let cell = new Cell({ bmsIc: bmsIc._id });
    cell = await cell.save({ new: true }, { session });
    cells.push(cell._id);
  }
  let temperatureSensors = [];
  for (let i = 0; i < noOfTemperatureSensors; i++) {
    let temperatureSensor = new TemperatureSensor({ bmsIc: bmsIc._id });
    temperatureSensor = await temperatureSensor.save(
      { new: true },
      { session }
    );
    temperatureSensors.push(temperatureSensor._id);
  }
  bmsIc.cells = cells;
  bmsIc.temperatureSensors = temperatureSensors;

  await bmsIc.save({ session });
};


const postMergeDeviceWithBatteryPack = async (req, res, next) => {
  const body = async (req, res, next, session) => {
    // find device and set batterypack with that
    const device = await Device.findById(req.body.deviceId);
    if (!device) {
      const error = new Error(
        "Couldn't find device with deviceId " + req.body.deviceId
      );
      error.statusCode = 404;
      throw error;
    } 
    //check if battery pack id exists or not
    let batteryPack = await BatteryPack.findById(req.body.batteryPackId);
    if (!batteryPack) {
      const error = new Error(
        "Couldn't find BatteryPack with Id " + req.body.deviceId
      );
      error.statusCode = 404;
      throw error;
    }
    device.batteryPack = req.body.batteryPackId;
    // save device with battery pack linked
    device = await device.save({ session: session, new: true });
    return {
      status: 202,
      data: {
        message: "Device merged with battery pack Successfully",
        device: device,
      },
    };
  };
  postData(req, res, next, body);
};

const postCreateDevice = async (req, res, next) => {
  const body = async (req, res, next, session) => {
    const device = new Device({
      deviceUniqueId: req.body.deviceUniqueId,
      user: null,
      vehicle: null,
      deviceName: req.body.deviceName,
      trip: [],
      batteryPack: req.body.batteryPackId,
    });
    device = await device.save({ session: session, new: true });
    return {
      status: 201,
      data: {
        message: "Device created successfully",
        device: device,
      },
    };
  };
  postData(req, res, next, body);
};

const postCreateBmsIc = async (req, res, next) => {
  console.log(req.body);
  const body = async (req, res, next, session) => {
    await initBmsIc(
      req.body.bmsUniqueId,
      req.body.isMaster,
      req.body.bmsName,
      req.body.noOfCells,
      req.body.noOfTemperatureSensors,
      session
    );
    return {
      status: 201,
      data: {
        message: "BMS IC created Successfully",
      },
    };
  };
  postData(req, res, next, body);
};

const initBatteryPack = async (
  batteryPackUniqueId,
  cellChemistry,
  manufacturer,
  maxVoltage,
  minVoltage,
  power,
  capacity,
  ratedCurrent,
  maxCurrent,
  maxTemperature,
  session
) => {
  let batteryPack = new BatteryPack({
    batteryPackUniqueId,
    cellChemistry,
    manufacturer,
    maxVoltage,
    minVoltage,
    power,
    capacity,
    ratedCurrent,
    maxCurrent,
    maxTemperature,
  });
  await batteryPack.save({ session });
};

const postCreateBatteryPack = async (req, res, next) => {
  const body = async (req, res, next, session) => {
    await initBatteryPack(
      req.body.batteryPackUniqueId,
      req.body.cellChemistry,
      req.body.manufacturer,
      req.body.maxVoltage,
      req.body.minVoltage,
      req.body.power,
      req.body.capacity,
      req.body.ratedCurrent,
      req.body.maxCurrent,
      req.body.maxTemperature,
      session
    );

    return {
      status: 201,
      data: {
        message: "Battery Pack created Successfully",
      },
    };
  };
  postData(req, res, next, body);
};

const initMergeBatteryPackAndBmsIcs = async (batteryPackId, bmsIc, session) => {
  let batteryPack = await BatteryPack.findOne({ _id: batteryPackId }, null, {
    session,
  });
  let bmsIcs = [];
  for (let item of bmsIc) {
    let ic = await BmsIc.findOne({ _id: item }, null, { session });
    bmsIcs.push(ic);
  }
  let response = { status: 200, data: {} };
  if (batteryPack && bmsIcs.length === bmsIc.length) {
    batteryPack.bmsIc = bmsIc;
    await batteryPack.save({ session });
    for (let item of bmsIcs) {
      item.batteryPack = batteryPackId;
      await item.save({ session });
    }
    response.data.message = "IC boards merged";
  } else {
    const error = new Error(`Battery Pack or ICs not found`);
    error.statusCode = 404;
    throw error;
  }
  return response;
};

const postMergeBatteryPackAndBmsIcs = async (req, res, next) => {
  const body = async (req, res, next, session) => {
    console.log(req.body);
    const response = await initMergeBatteryPackAndBmsIcs(
      req.body.batteryPackId,
      req.body.bmsIc,
      session
    );

    return response;
  };
  postData(req, res, next, body);
};

// numTempSensorPerIC,
// numVoltSensor,
// let tempSensors = [];
// let voltageSensors = [];
//   // create a temp sensors array
//   for (let i = 0; i < numTempSensorPerIC; i++) {
//     let tempSensor = new TemperatureSensor({
//       bsmIc: bmsIc._id,
//       temperature: [],
//     });
//     tempSensor = await tempSensor.save({ new: true }, { session });
//     tempSensors.push(tempSensor._id);
//   }

//   // create cells array
//   for (let i = 0; i < numVoltSensor; i++) {
//     let cell = new Cell({
//       bsmIc: bmsIc._id,
//       voltage: [],
//       power: 0,
//     });
//     cell = await cell.save({ new: true }, { session });
//     voltageSensors.push(cell._id);
//   }
//   BmsIc.findByIdAndUpdate(
//     bmsIc._id,
//     {
//       cells: { $push: { $each: { voltageSensors } } },
//       temperatureSensors: {
//         $push: { $each: { tempSensors } },
//       },
//     },
//     {
//       session: session,
//       new: true,
//     }
//   );
// };

// const initDevice = async (req, res, next) => {
//   const body = async (req, res, next, session) => {
//     const deviceUniqueId = req.body.deviceUniqueId;
//     // check for possibel units in the device
//   };
// };

// const postCreateTrip = async (req, res, next) => {
//   const body = async (req, res, next, session) => {
//     let device = await Device.findOne(req.body.deviceUniqueId);
//     if (!device) {
//       const error = new Error(
//         "Device Not Found \n Trying to create session using Unregistered Device"
//       );
//       error.statusCode = 403;
//       throw error;
//     } else {
//       const trip = new Trip({
//         pilot: req.body.pilotId,
//         startTime: req.body.startTime,
//         endTime: req.body.endTime,
//         device: device._id,
//       });
//       await trip.save({ session: true });
//       device.trip.push(trip._id);
//       device = device.save({ session: true, new: true });
//       return {
//         tripId: trip._id,
//         deviceId: device._id,
//       };
//     }
//   };
//   postData(req, res, next, body);
// };

// const postUpdateTrip = async (req, res, next) => {
//   const body = async (req, res, next, session) => {
//     let object = {};
//     if (req.body.tripName) {
//       object.tripName = req.body.tripName;
//     }
//     if (req.body.endTime) {
//       object.endTime = req.body.endTime;
//     }

//     let trip = await Trip.findByIdAndUpdate(req.body.tripId, object, {
//       session: true,
//       new: true,
//     });
//     return { tripId: trip._id };
//   };
//   postData(req, res, next, body);
// };
// const getTripData = async (req, res, next) => {
//   // get data using trip id
// };

// const postDeviceData = async (req, res, next) => {
//   const body = async (req, req, next, session) => {
//     const device = await Device.findById(req.body.deviceId);
//     const batteryPack = await BatteryPack.findById(device.batteryPack);
//     if (req.body.location) {
//       // will docation update for current trip
//     }
//     if (req.body.bmsData) {
//       // will do bms ic related data update for current trip
//       const bms_data = req.body.bmsData;
//       const num_bms = bms_data.num_bms;
//       const bms_ics_data = bms_data.data;
//       if (batteryPack.bms_ic.length === 0) {
//       }
//     }
//   };
// };

// const postCreateSession = (req, res) => {
//   const no_of_bms = req.body.no_of_bms;
//   const no_of_cells = req.body.no_of_cells;
//   const bms_names = req.body.bms_names;
//   const no_of_temp = req.body.no_of_temp;
//   const start_time = req.body.start_time;
//   const session_name = req.body.session_name;
//   const device_unique_id = req.body.device_unique_id;
//   const device_name = req.body.device_name;

//   // create session and out into device sessions array
//   // get battery pack information for device andn then get its ics and then update

//   const bms_ids = [];
//   Device.findOne({ device_unique_id: device_unique_id })
//     .then((device) => {
//       if (!device) {
//         device = new Device({
//           device_unique_id: device_unique_id,
//           device_name: device_name,
//           sessions: [],
//         });
//         console.log("Device", device);
//       }
//       console.log("Device", device);
//       return device;
//     })
//     .then((resDevice) => {
//       // create new session
//       const session = new Session({
//         no_of_bms: no_of_bms,
//         bms: [],
//         session_name: session_name,
//         start_time: start_time,
//         end_time: start_time,
//         device_id: resDevice._id,
//       });
//       resDevice.sessions.push(session._id); // push session id here

//       for (let i = 0; i < no_of_bms; i++) {
//         let bms = new BMS({
//           bms_name: bms_names[i],
//           voltage: [],
//           current: [],
//           temp: [],
//         });
//         bms_ids.push(bms._id);
//         session.bms.push(bms._id);

//         // create new object for each cell
//         for (let j = 0; j < no_of_cells[i]; j++) {
//           let cell = new Voltage({
//             cell_name: "V_" + (j + 1),
//             data: [],
//             bms_id: bms._id,
//           });
//           bms.voltage.push(cell._id);
//           cell
//             .save()
//             .then((saved_document) => {
//               console.log(`Saved document cell ${j} ${saved_document}`);
//             })
//             .catch((err) => [console.log(err)]);
//         }

//         // create new object for each temperature
//         for (let j = 0; j < no_of_temp[i]; j++) {
//           let temp = new Temperature({
//             temp_name: "T_" + (j + 1),
//             data: [],
//             bms_id: bms._id,
//           });
//           bms.temp.push(temp._id);
//           temp
//             .save()
//             .then((saved_document) => {
//               console.log(`Saved document temp${j} ${saved_document}`);
//             })
//             .catch((err) => [console.log(err)]);
//         }

//         // create record for current
//         let current = new Current({
//           bms_id: bms._id,
//           data: [],
//           current_name: "C_1",
//         });
//         bms.current.push(current._id);
//         current
//           .save()
//           .then((saved_document) => {
//             console.log(`Saved document ${saved_document}`);
//           })
//           .catch((err) => [console.log(err)]);

//         bms
//           .save()
//           .then((saved_document) => {
//             console.log(`Saved document ${saved_document}`);
//           })
//           .catch((err) => [console.log(err)]);
//       }
//       session
//         .save()
//         .then((saved_document) => {
//           console.log(`Saved document ${saved_document}`);
//         })
//         .catch((err) => [console.log(err)]);
//       resDevice
//         .save()
//         .then((saved_document) => {
//           console.log(`Saved document ${saved_document}`);
//         })
//         .catch((err) => [console.log(err)]);
//       res.send({
//         session_id: session._id,
//         bms_ids: bms_ids,
//         device_id: resDevice._id,
//       });
//     })
//     .catch((err) => console.log(err));
// };

// const postSessionBmsData = (req, res, next) => {
//   //get data from body
//   console.log(req.body);
//   const session_id = req.body.session_id;
//   // const no_of_bms = req.body.no_of_bms;
//   const session_name = req.body.session_name;
//   const start_time = req.body.start_time;
//   const end_time = req.body.end_time;
//   const bms_data = req.body.bms;
//   console.log(session_id, session_name, start_time, end_time);
//   console.log(bms_data);

//   // const session_object = await Session.findOne({ session_id: session_id });
//   Session.findOne({ _id: session_id })
//     .exec()
//     .then((session_object) => {
//       if (session_object != null) {
//         console.log("Session object found");
//         console.log(session_object);

//         bms_data.forEach(async (bms) => {
//           const voltage_update_operations = {}; // for voltage update operations in one go
//           const current_update_operations = {}; // for current update operations in one go
//           const temperature_update_operations = {}; // for temperature update operations in one go

//           const voltage_data = bms.voltage;
//           const current_data = bms.current;
//           const temp_data = bms.temp;
//           // get list of references of voltage current and temperatures to get these records in same order so that it can be written in same order
//           BMS.findOne({ _id: bms.bms_id })
//             .exec()
//             .then((bms_ref) => {
//               const voltage_ref = bms_ref.voltage;
//               const temperature_ref = bms_ref.temp;
//               const current_ref = bms_ref.current;

//               //========================================================================================================
//               // ========================================Voltage Update Operations =====================================
//               //========================================================================================================
//               // update voltage data with new values
//               voltage_data.forEach((batterypack_voltage) => {
//                 const data = batterypack_voltage.data;
//                 const timestamp = batterypack_voltage.timestamp;
//                 // console.log("keys: ", Object.keys(voltage_update_operations));
//                 data.forEach((cell_volt, index) => {
//                   // console.log(index);
//                   // console.log(`cell volt ${cell_volt}`);
//                   // console.log(`volt_id: ${voltage_ref[index]}`);

//                   if (
//                     Object.keys(voltage_update_operations).includes(
//                       `${voltage_ref[index]}`
//                     )
//                   ) {
//                     // console.log(`voltage ref  presnt `);
//                     // console.log("new cell data");
//                     voltage_update_operations[voltage_ref[index]].bms_id =
//                       bms.bms_id;
//                     voltage_update_operations[
//                       voltage_ref[index]
//                     ].new_cell_data.push({
//                       timeStamp: timestamp,
//                       value: cell_volt,
//                     });
//                   } else {
//                     // console.log(`voltage ref not presnt `);
//                     voltage_update_operations[voltage_ref[index]] = {
//                       bms_id: bms.bms_id,
//                       new_cell_data: [
//                         {
//                           timeStamp: timestamp,
//                           value: cell_volt,
//                         },
//                       ],
//                     };
//                   }
//                 });
//               });
//               // console.log(
//               //   voltage_update_operations[voltage_ref[0]].new_cell_data
//               // );
//               //========================================================================================================
//               // ========================================Temperature Update Operations =================================
//               //========================================================================================================

//               temp_data.forEach((batterypack_temp) => {
//                 const data = batterypack_temp.data;
//                 const timestamp = batterypack_temp.timestamp;

//                 data.forEach((cell_temp, index) => {
//                   // console.log(`Temp_id ${temperature_ref[index].temp_id}`);
//                   if (
//                     Object.keys(temperature_update_operations).includes(
//                       `${temperature_ref[index]}`
//                     )
//                   ) {
//                     temperature_update_operations[
//                       temperature_ref[index]
//                     ].bms_id = bms.bms_id;
//                     temperature_update_operations[
//                       temperature_ref[index]
//                     ].new_cell_data.push({
//                       timeStamp: timestamp,
//                       value: cell_temp,
//                     });
//                   } else {
//                     temperature_update_operations[temperature_ref[index]] = {
//                       bms_id: bms.bms_id,
//                       new_cell_data: [
//                         {
//                           timeStamp: timestamp,
//                           value: cell_temp,
//                         },
//                       ],
//                     };
//                   }
//                 });
//               });

//               //========================================================================================================
//               // ========================================Current Update Operations =====================================
//               //========================================================================================================

//               current_data.forEach((current) => {
//                 const cells_current_data = current.data;
//                 const timestamp_data_point = current.timestamp;
//                 if (
//                   Object.keys(current_update_operations).includes(
//                     `${current_ref[0]}`
//                   )
//                 ) {
//                   current_update_operations[current_ref[0]].bms_id = bms.bms_id;
//                   current_update_operations[current_ref[0]].new_cell_data.push({
//                     timeStamp: timestamp_data_point,
//                     value: cells_current_data,
//                   });
//                 } else {
//                   current_update_operations[current_ref[0]] = {
//                     bms_id: bms.bms_id,
//                     new_cell_data: [
//                       {
//                         timeStamp: timestamp_data_point,
//                         value: cells_current_data,
//                       },
//                     ],
//                   };
//                 }
//               });
//               //============================================================================================================
//               //========================BULK UPDATING CURRENT, VOLTAGE AND TEMPERATURE =====================================
//               //============================================================================================================

//               //============================================================================================================
//               //====================================VOLTAGE BULK UPDATE ====================================================
//               //============================================================================================================
//               // get Model bulk update operation ready and update
//               // console.log("================================");
//               // console.log(voltage_update_operations);
//               // console.log("================================================");
//               const voltage_update_records = [];
//               Object.keys(voltage_update_operations).forEach((key) => {
//                 voltage_update_records.push({
//                   cell_id: key,
//                   bms_id: voltage_update_operations[key].bms_id,
//                   new_cell_data: voltage_update_operations[key].new_cell_data,
//                 });
//               });
//               // console.log(
//               //   "voltage in each ref",
//               //   voltage_update_records[0].new_cell_data
//               // );
//               // voltage update records
//               // console.log(
//               //   `Update Voltages ${Object.keys(voltage_update_operations)}`
//               // );
//               // Create an array of update operations
//               const updateVoltageOperations = voltage_update_records.map(
//                 (record) => ({
//                   updateOne: {
//                     filter: { bms_id: record.bms_id, _id: record.cell_id },
//                     update: {
//                       $push: { data: { $each: [...record.new_cell_data] } },
//                     },
//                   },
//                 })
//               );

//               // Use bulkWrite to execute all update operations in one go
//               Voltage.bulkWrite(updateVoltageOperations)
//                 .then((result) => {
//                   console.log("Bulk Write Result:", result);
//                 })
//                 .catch((err) => {
//                   console.error("Error:", err);
//                 });
//               //============================================================================================================
//               //================================== END BULK VOLTAGE UPDATES ================================================
//               //============================================================================================================

//               //============================================================================================================
//               //=====================================TEMPERATURE BULK UPDATE ===============================================
//               //============================================================================================================
//               // get Model bulk update operation ready and update
//               const temp_update_records = [];
//               Object.keys(temperature_update_operations).forEach((key) => {
//                 temp_update_records.push({
//                   temp_id: key,
//                   bms_id: temperature_update_operations[key].bms_id,
//                   new_cell_data:
//                     temperature_update_operations[key].new_cell_data,
//                 });
//               });

//               // Create an array of update operations
//               const updateTempOperations = temp_update_records.map(
//                 (record) => ({
//                   updateOne: {
//                     filter: { bms_id: record.bms_id, _id: record.temp_id },
//                     update: {
//                       $push: { data: { $each: [...record.new_cell_data] } },
//                     },
//                   },
//                 })
//               );

//               // Use bulkWrite to execute all update operations in one go
//               Temperature.bulkWrite(updateTempOperations)
//                 .then((result) => {
//                   console.log("Bulk Write Result:", result);
//                 })
//                 .catch((err) => {
//                   console.error("Error:", err);
//                 });
//               //============================================================================================================
//               //=================================== END TEMPERATURE BULK UPDATE ============================================
//               //============================================================================================================

//               //============================================================================================================
//               //================================== CURRENT BULK UPDATE =====================================================
//               //============================================================================================================
//               // get Model bulk update operation ready and update
//               const current_update_records = [];
//               Object.keys(current_update_operations).forEach((key) => {
//                 current_update_records.push({
//                   cell_id: key,
//                   bms_id: current_update_operations[key].bms_id,
//                   new_cell_data: current_update_operations[key].new_cell_data,
//                 });
//               });
//               // console.log(current_update_records[0].new_cell_data);
//               // Create an array of update operations
//               const updateCurrentOperations = current_update_records.map(
//                 (record) => ({
//                   updateOne: {
//                     filter: { bms_id: record.bms_id, _id: record.cell_id },
//                     update: {
//                       $push: { data: { $each: [...record.new_cell_data] } },
//                     },
//                   },
//                 })
//               );

//               // Use bulkWrite to execute all update operations in one go
//               Current.bulkWrite(updateCurrentOperations)
//                 .then((result) => {
//                   console.log("Bulk Write Result:", result);
//                 })
//                 .catch((err) => {
//                   console.error("Error:", err);
//                 });
//               //============================================================================================================
//               //========================================== CURRENT BULK UPDATE ENDS ========================================
//               //============================================================================================================
//               //  send response to client

//               //============================================================================================================
//               //===========================END BULK UPDATING CURRENT, VOLTAGE AND TEMPERATURE===============================
//               //============================================================================================================
//             })
//             .catch((err) => {
//               console.log(err);
//             });
//         });
//         session_object
//           .updateOne({
//             end_time: end_time,
//           })
//           .then((updatedSession) => {
//             console.log(`Updated Session ${updatedSession}`);
//           })
//           .catch((err) => {
//             console.log(err);
//             res.send(err.message);
//           });

//         res.send("done");
//       } else {
//         console.log("Session object not found");
//         console.log(session_object);
//         res.send("Not Found");
//       }
//     })
//     .catch((err) => {
//       console.log(err);
//       res.send(err.message);
//     });
// };

// const getSessionData = (req, res) => {
//   // Usage: Fetch session and then dynamically populate references
//   const sessionId = req.query.sessionId;
//   // Function to dynamically populate references
//   async function populateReferences(doc) {
//     // Use Mongoose's populate method for subdocuments
//     console.log(doc);
//     return doc
//       .populate({
//         path: "bms",
//         populate: [{ path: "voltage" }, { path: "current" }, { path: "temp" }],
//       })
//       .then((populatedDoc) => {
//         return populatedDoc;
//       })
//       .catch((err) => {
//         console.log(err);
//         throw err;
//       });
//   }

//   Session.findById(sessionId)
//     .exec()
//     .then((session) => {
//       if (!session) {
//         return {};
//       }
//       return populateReferences(session);
//     })
//     .then((populatedSession) => {
//       // console.log(populatedSession.bms[0].voltage[0]);

//       res.send(populatedSession);
//     })
//     .catch((err) => {
//       console.error("Error:", err);
//       res.send({});
//     });
// };

// const getSessions = (req, res, next) => {
//   Session.find()
//     .select("_id, session_name")
//     .exec()
//     .then((sessions) => {
//       console.log(sessions);
//       res.send(sessions);
//     })
//     .catch((err) => {
//       console.log(err);
//     });
// };

// const getAllDevices = (req, res, next) => {
//   Device.find()
//     .select("_id device_name device_unique_id")
//     .exec()
//     .then((devices) => {
//       console.log(devices);
//       res.send(devices);
//     })
//     .catch((err) => {
//       console.log(err);
//       res.send([]);
//     });
// };

// const getDeviceSessions = (req, res, next) => {
//   const device_id = req.params.device_id;
//   console.log("device_id: " + device_id);
//   Device.findOne({ device_unique_id: device_id })
//     .select("_id device_name device_unique_id sessions")
//     .populate("sessions", "_id device_id session_name start_time end_time")
//     .exec()
//     .then((sessions) => {
//       res.send(sessions);
//     })
//     .catch((err) => {
//       console.log(err);
//       res.send([]);
//     });
// };

export {
  postCreateBatteryPack,
  // getAllDevices,
  // getDeviceSessions,
  // getSessionData,
  // getSessions,
  // postCreateSession,
  // postCreateTrip,
  // postSessionBmsData,
  // postUpdateTrip,
  postCreateBmsIc,
  postCreateDevice,
  postMergeBatteryPackAndBmsIcs,
  postMergeDeviceWithBatteryPack,
};
