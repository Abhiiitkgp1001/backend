import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import adminRoutes from "./routes/admin.js";
import authRoutes from "./routes/auth.js";
import dataRoutes from "./routes/data.js";
import testRoutes from "./routes/test.js";
import redisClient from "./utils/redisClient.js";

//config
dotenv.config();

const app = express();
const port = process.env.PORT || 8080;
const dbUrl = process.env.MONGODB_URL;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//set routes
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/data", dataRoutes);
app.use("/test", testRoutes);

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
          redisClient
            .set("a", "1234")
            .then((redisResult) => {
              console.log(redisResult);
            })
            .catch((error) => {
              console.log(`Redis Error: ${error}`);
            });
          redisClient
            .get("a")
            .then((val) => {
              console.log(val);
            })
            .catch((error) => {
              console.log(error);
            });

          console.log(`Express app running on port ${port}!`);
        });
      })
      .catch((error) => console.log(error));
  })
  .catch((err) => {
    console.log(err);
  });
