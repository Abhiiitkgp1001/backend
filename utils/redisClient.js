// const Redis = require("ioredis");
// import { createClient } from "redis";
const Redis = require("redis");

// Create a Redis client instance with your Redis Labs credentials
const redisClient = Redis.createClient({
  password: "ItMQfvJ6q3hNAj8egS8FUb13NDE95W5e",
  socket: {
    host: "redis-17609.c267.us-east-1-4.ec2.cloud.redislabs.com",
    port: 17609,
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
