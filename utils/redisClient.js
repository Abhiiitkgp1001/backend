// const Redis = require("ioredis");
// import { createClient } from "redis";
const Redis = require("redis");

// Create a Redis client instance with your Redis Labs credentials
const redisClient = Redis.createClient({
  password: "QktSCoIEaWQbHQtrs6FnwAhTb606LikI",
  socket: {
    host: "redis-14666.c280.us-central1-2.gce.cloud.redislabs.com",
    port: 14666,
  },
});

// new Redis({
//   password: "FmjPi2kB6Jz2CpnO0Q2sW5k2HCe9kQGO",
//   socket: {
//     host: "redis-19452.c62.us-east-1-4.ec2.cloud.redislabs.com",
//     port: 19452,
//   },
// });

// Handle connection events (optional)
redisClient.on("connect", () => {
  console.log("Connected to Redis server");
});

redisClient.on("error", (error) => {
  console.error("Redis connection error:", error);
});

// Export the Redis client to use it in other parts of your application
module.exports = redisClient;

// const client = createClient({
//   password: "FmjPi2kB6Jz2CpnO0Q2sW5k2HCe9kQGO",
//   socket: {
//     host: "redis-19452.c62.us-east-1-4.ec2.cloud.redislabs.com",
//     port: 19452,
//   },
// });
