import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import adminRoutes from "./routes/admin.js";
import authRoutes from "./routes/auth.js";
import dataRoutes from "./routes/deviceData.js";
import manufacturerRoutes from "./routes/manufacturerRoute.js";
import testRoutes from "./routes/test.js";
import dataIngestion from "./routes/ingestion.js"
import redisClient from "./utils/redisClient.js";

//config
dotenv.config();

const app = express();
const port = process.env.PORT || 8080;
const dbUrl = process.env.MONGODB_URL;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
// Middleware to parse raw binary data
app.use(bodyParser.raw({ type: 'application/octet-stream', limit: '10mb' }));
app.use(bodyParser.json());

//set routes
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/data", dataRoutes);
app.use("/manufacturer", manufacturerRoutes);
app.use("/test", testRoutes);
app.use("/api/ingestion", dataIngestion)

// app error handler middleware
app.use((error, req, res, next) => {
  console.log(error.message);
  // console.log("Error occured");
  // console.log(error.data);
  res
    .status(error.statusCode || 500)
    .json({ message: error.message, data: error.data });
});

try {
  const dbConnenction = await mongoose.connect(dbUrl);
  const redisConnection = await redisClient.connect();
  app.listen(port, () => {
    console.log("db connection - " + mongoose.connection.readyState);

    // console.log("redis connection - " + redisConnection);
    console.log(`Express app running on port ${port}!`);
    
  });
} catch (err) {
  console.log(err);
}
