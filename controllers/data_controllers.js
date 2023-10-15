const BMS = require("../models/bms.js");
const Current = require("../models/current.js");
const Voltage = require("../models/voltage");
const Temperature = require("../models/temperature.js");
const Session = require("../models/session.js");
const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");

exports.create_session_controller = (req, res) => {
  const no_of_bms = req.body.no_of_bms;
  const no_of_cells = req.body.no_of_cells;
  const bms_names = req.body.bms_names;
  const no_of_temp = req.body.no_of_temp;
  const start_time = req.body.start_time;
  const session_name = req.body.session_name;

  const bms_ids = [];
  // create new session
  const session = new Session({
    no_of_bms: no_of_bms,
    bms: [],
    session_name: session_name,
    start_time: start_time,
    end_time: start_time,
  });

  for (let i = 0; i < no_of_bms; i++) {
    let bms = new BMS({
      bms_name: bms_names[i],
      voltage: [],
      current: [],
      temp: [],
    });
    bms_ids.push(bms._id);
    session.bms.push(bms._id);

    // create new object for each cell
    for (let j = 0; j < no_of_cells[i]; j++) {
      let cell = new Voltage({
        cell_name: "V_" + (j + 1),
        data: [],
        bms_id: bms._id,
      });
      bms.voltage.push(cell._id);
      cell
        .save()
        .then((saved_document) => {
          console.log(`Saved document cell ${j} ${saved_document}`);
        })
        .catch((err) => [console.log(err)]);
    }

    // create new object for each temperature
    for (let j = 0; j < no_of_temp[i]; j++) {
      let temp = new Temperature({
        temp_name: "T_" + (j + 1),
        data: [],
        bms_id: bms._id,
      });
      bms.temp.push(temp._id);
      temp
        .save()
        .then((saved_document) => {
          console.log(`Saved document temp${j} ${saved_document}`);
        })
        .catch((err) => [console.log(err)]);
    }

    // create record for current
    let current = new Current({
      bms_id: bms._id,
      data: [],
      current_name: "C_1",
    });
    bms.current.push(current._id);
    current
      .save()
      .then((saved_document) => {
        console.log(`Saved document ${saved_document}`);
      })
      .catch((err) => [console.log(err)]);

    bms
      .save()
      .then((saved_document) => {
        console.log(`Saved document ${saved_document}`);
      })
      .catch((err) => [console.log(err)]);
  }
  session
    .save()
    .then((saved_document) => {
      console.log(`Saved document ${saved_document}`);
    })
    .catch((err) => [console.log(err)]);
  res.send({
    session_id: session._id,
    bms_ids: bms_ids,
  });
};

exports.session_bms_data_controller = (req, res, next) => {
  //get data from body
  console.log(req.body);
  const session_id = req.body.session_id;
  const no_of_bms = req.body.no_of_bms;
  const session_name = req.body.session_name;
  const start_time = req.body.start_time;
  const end_time = req.body.end_time;
  const bms_data = req.body.bms;
  console.log(session_id, session_name, start_time, end_time);
  console.log(bms_data);

  // const session_object = await Session.findOne({ session_id: session_id });
  Session.findOne({ _id: session_id })
    .exec()
    .then((session_object) => {
      if (session_object != null) {
        console.log("Session object found");
        console.log(session_object);

        bms_data.forEach(async (bms) => {
          const voltage_update_operations = {}; // for voltage update operations in one go
          const current_update_operations = {}; // for current update operations in one go
          const temperature_update_operations = {}; // for temperature update operations in one go

          const voltage_data = bms.voltage;
          const current_data = bms.current;
          const temp_data = bms.temp;
          // get list of references of voltage current and temperatures to get these records in same order so that it can be written in same order
          BMS.findOne({ _id: bms.bms_id })
            .exec()
            .then((bms_ref) => {
              const voltage_ref = bms_ref.voltage;
              const temperature_ref = bms_ref.temp;
              const current_ref = bms_ref.current;

              //========================================================================================================
              // ========================================Voltage Update Operations =====================================
              //========================================================================================================
              // update voltage data with new values
              voltage_data.forEach((batterypack_voltage) => {
                const data = batterypack_voltage.data;
                const timestamp = batterypack_voltage.timeStamp;
                data.forEach((cell_volt, index) => {
                  // console.log(`cell volt ${cell_volt}`);
                  // console.log(`volt_id: ${voltage_ref[index].cell_id}`);
                  if (
                    voltage_ref[index].cell_id in
                    Object.keys(voltage_update_operations)
                  ) {
                    voltage_update_operations[voltage_ref[index]].bms_id =
                      bms.bms_id;
                    voltage_update_operations[
                      voltage_ref[index]
                    ].new_cell_data.push({
                      timeStamp: timestamp,
                      value: cell_volt,
                    });
                  } else {
                    voltage_update_operations[voltage_ref[index]] = {
                      bms_id: bms.bms_id,
                      new_cell_data: [
                        {
                          timeStamp: timestamp,
                          value: cell_volt,
                        },
                      ],
                    };
                  }
                });
              });
              //========================================================================================================
              // ========================================Temperature Update Operations =================================
              //========================================================================================================

              temp_data.forEach((batterypack_temp) => {
                const data = batterypack_temp.data;
                const timestamp = batterypack_temp.timeStamp;

                data.forEach((cell_temp, index) => {
                  // console.log(`Temp_id ${temperature_ref[index].temp_id}`);
                  if (
                    temperature_ref[index] in
                    Object.keys(temperature_update_operations)
                  ) {
                    temperature_update_operations[
                      temperature_ref[index]
                    ].bms_id = bms.bms_id;
                    temperature_update_operations[
                      temperature_ref[index]
                    ].new_cell_data.push({
                      timeStamp: timestamp,
                      value: cell_temp,
                    });
                  } else {
                    temperature_update_operations[temperature_ref[index]] = {
                      bms_id: bms.bms_id,
                      new_cell_data: [
                        {
                          timeStamp: timestamp,
                          value: cell_temp,
                        },
                      ],
                    };
                  }
                });
              });

              //========================================================================================================
              // ========================================Current Update Operations =====================================
              //========================================================================================================

              current_data.forEach((current) => {
                const cells_current_data = current.data;
                const timestamp_data_point = current.timestamp;
                if (current_ref[0] in Object.keys(current_update_operations)) {
                  current_update_operations[current_ref[0]].bms_id = bms.bms_id;
                  current_update_operations[current_ref[0]].new_cell_data.push({
                    timeStamp: timestamp_data_point,
                    value: cells_current_data,
                  });
                } else {
                  current_update_operations[current_ref[0]] = {
                    bms_id: bms.bms_id,
                    new_cell_data: [
                      {
                        timeStamp: timestamp_data_point,
                        value: cells_current_data,
                      },
                    ],
                  };
                }
              });
              //============================================================================================================
              //========================BULK UPDATING CURRENT, VOLTAGE AND TEMPERATURE =====================================
              //============================================================================================================

              //============================================================================================================
              //====================================VOLTAGE BULK UPDATE ====================================================
              //============================================================================================================
              // get Model bulk update operation ready and update
              // console.log("================================");
              // console.log(voltage_update_operations);
              // console.log("================================================");
              const voltage_update_records = [];
              Object.keys(voltage_update_operations).forEach((key) => {
                voltage_update_records.push({
                  cell_id: key,
                  bms_id: voltage_update_operations[key].bms_id,
                  new_cell_data: voltage_update_operations[key].new_cell_data,
                });
              });
              // voltage update records
              // console.log(
              //   `Update Voltages ${Object.keys(voltage_update_operations)}`
              // );
              // Create an array of update operations
              const updateVoltageOperations = voltage_update_records.map(
                (record) => ({
                  updateOne: {
                    filter: { bms_id: record.bms_id, _id: record.cell_id },
                    update: {
                      $push: { data: { $each: record.new_cell_data } },
                    },
                  },
                })
              );

              // Use bulkWrite to execute all update operations in one go
              Voltage.bulkWrite(updateVoltageOperations)
                .then((result) => {
                  console.log("Bulk Write Result:", result);
                })
                .catch((err) => {
                  console.error("Error:", err);
                });
              //============================================================================================================
              //================================== END BULK VOLTAGE UPDATES ================================================
              //============================================================================================================

              //============================================================================================================
              //=====================================TEMPERATURE BULK UPDATE ===============================================
              //============================================================================================================
              // get Model bulk update operation ready and update
              const temp_update_records = [];
              Object.keys(temperature_update_operations).forEach((key) => {
                temp_update_records.push({
                  temp_id: key,
                  bms_id: temperature_update_operations[key].bms_id,
                  new_cell_data:
                    temperature_update_operations[key].new_cell_data,
                });
              });

              // Create an array of update operations
              const updateTempOperations = temp_update_records.map(
                (record) => ({
                  updateOne: {
                    filter: { bms_id: record.bms_id, _id: record.temp_id },
                    update: {
                      $push: { data: { $each: record.new_cell_data } },
                    },
                  },
                })
              );

              // Use bulkWrite to execute all update operations in one go
              Temperature.bulkWrite(updateTempOperations)
                .then((result) => {
                  console.log("Bulk Write Result:", result);
                })
                .catch((err) => {
                  console.error("Error:", err);
                });
              //============================================================================================================
              //=================================== END TEMPERATURE BULK UPDATE ============================================
              //============================================================================================================

              //============================================================================================================
              //================================== CURRENT BULK UPDATE =====================================================
              //============================================================================================================
              // get Model bulk update operation ready and update
              const current_update_records = [];
              Object.keys(current_update_operations).forEach((key) => {
                current_update_records.push({
                  cell_id: key,
                  bms_id: current_update_operations[key].bms_id,
                  new_cell_data: current_update_operations[key].new_cell_data,
                });
              });

              // Create an array of update operations
              const updateCurrentOperations = current_update_records.map(
                (record) => ({
                  updateOne: {
                    filter: { bms_id: record.bms_id, _id: record.cell_id },
                    update: {
                      $push: { data: { $each: record.new_cell_data } },
                    },
                  },
                })
              );

              // Use bulkWrite to execute all update operations in one go
              Current.bulkWrite(updateCurrentOperations)
                .then((result) => {
                  console.log("Bulk Write Result:", result);
                })
                .catch((err) => {
                  console.error("Error:", err);
                });
              //============================================================================================================
              //========================================== CURRENT BULK UPDATE ENDS ========================================
              //============================================================================================================
              //  send response to client

              //============================================================================================================
              //===========================END BULK UPDATING CURRENT, VOLTAGE AND TEMPERATURE===============================
              //============================================================================================================
            })
            .catch((err) => {
              console.log(err);
            });
        });
        res.send("done");
      } else {
        console.log("Session object not found");
        console.log(session_object);
        res.send("Not Found");
      }
    })
    .catch((err) => {
      console.log(err);
      res.send(err.message);
    });
};

exports.getSessionDataController = (req, res) => {
  // Usage: Fetch session and then dynamically populate references
  const sessionId = req.query.sessionId;
  // Function to dynamically populate references
  async function populateReferences(doc) {
    // Use Mongoose's populate method for subdocuments
    return doc
      .populate({
        path: "bms",
        populate: [{ path: "voltage" }, { path: "current" }, { path: "temp" }],
      })
      .then((populatedDoc) => {
        return populatedDoc;
      })
      .catch((err) => {
        console.log(err);
      });
  }

  Session.findById(sessionId)
    .exec()
    .then((session) => {
      return populateReferences(session);
    })
    .then((populatedSession) => {
      console.log(populatedSession.bms[0].voltage[0]);

      res.send(populatedSession);
    })
    .catch((err) => {
      console.error("Error:", err);
    });
};

exports.getSessionsController = (req, res, next) => {
  Session.find()
    .select("_id, session_name")
    .exec()
    .then((sessions) => {
      console.log(sessions);
      res.send(sessions);
    })
    .catch((err) => {
      console.log(err);
    });
};
// populate: [
//   {
//     path: "bms_id",
//     populate: [
//       { path: "voltage" },
//       { path: "current" },
//       { path: "temp" },
//     ],
//   },
// ],
