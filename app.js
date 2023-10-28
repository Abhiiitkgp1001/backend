const express = require("express");
const bodyParser = require("body-parser");
const bms_data_contoller = require("./controllers/data_controllers.js");
const mongoose = require("mongoose");
const cors = require('cors');
const app = express();
const port = 3000;
const dbUrl =
  "mongodb+srv://celldoc24:8FRDnVp4p8iFJdAn@clustercelldoc.rth33nb.mongodb.net/?retryWrites=true&w=majority";

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
// Parse JSON requests
app.use(bodyParser.json());

//fetch session data

app.get("/data/get_all_sessions", bms_data_contoller.getSessionsController);

app.get("/data/get_session_data", bms_data_contoller.getSessionDataController);

app.get("/data/get_all_devices", bms_data_contoller.getAllDevicesController);

app.get("/data/get_device_all_sessions/:device_id", bms_data_contoller.getDeviceSessionsController);

// post route for data sendings
app.post(
  "/data/session_bms_data",
  bms_data_contoller.session_bms_data_controller
);

app.post("/data/create_session", bms_data_contoller.create_session_controller);

mongoose
  .connect(dbUrl)
  .then((result) => {
    app.listen(port, () => console.log(`Express app running on port ${port}!`));
  })
  .catch((err) => {
    console.log(err);
  });
