const express = require("express");
const bodyParser = require("body-parser");
const bms_data_contoller = require("./controllers/data_controllers.js");
const mongoose = require("mongoose");
const cors = require("cors");
const redisClient = require("./utils/redisClient");
const apiAuth = require("./middlewares/apiEndPointAuth");

const authRoutes = require("./routes/auth");

const app = express();
const port = 80;
const dbUrl =
  "mongodb+srv://celldoc24:8FRDnVp4p8iFJdAn@clustercelldoc.rth33nb.mongodb.net/?retryWrites=true&w=majority";

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
// Parse JSON requests
app.use(bodyParser.json());

//set auth routes
app.use("/auth", authRoutes);

//fetch session data
app.get(
  "/data/get_all_sessions",
  apiAuth,
  bms_data_contoller.getSessionsController
);

app.get(
  "/data/get_session_data",
  apiAuth,
  bms_data_contoller.getSessionDataController
);

app.get(
  "/data/get_all_devices",
  apiAuth,
  bms_data_contoller.getAllDevicesController
);

app.get(
  "/data/get_device_all_sessions/:device_id",
  apiAuth,
  bms_data_contoller.getDeviceSessionsController
);

// post route for data sendings
app.post(
  "/data/session_bms_data",
  apiAuth,
  bms_data_contoller.session_bms_data_controller
);

app.post(
  "/data/create_session",
  apiAuth,
  bms_data_contoller.create_session_controller
);

// app error handler middleware
app.use((error, req, res, next) => {
  console.log(error.message);
  // console.log("Error occured");
  // console.log(error.data);
  res
    .status(error.statusCode || 500)
    .json({ message: error.message, data: error.data });
});
mongoose
  .connect(dbUrl)
  .then((result) => {
    redisClient
      .connect()
      .then((connection) => {
        app.listen(port, () => {
          // redisClient
          //   .set("a", "1234")
          //   .then((redisResult) => {
          //     console.log(redisResult);
          //   })
          //   .catch((error) => {
          //     console.log(`Redis Error: ${error}`);
          //   });
          // redisClient
          //   .get("a")
          //   .then((val) => {
          //     console.log(val);
          //   })
          //   .catch((error) => {
          //     console.log(error);
          //   });

          console.log(`Express app running on port ${port}!`);
        });
      })
      .catch((error) => console.log(error));
  })
  .catch((err) => {
    console.log(err);
  });

// app.listen(port, () => console.log(`Express app running on port ${port}!`));
