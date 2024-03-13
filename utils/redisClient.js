import Redis from "redis";

// Create a Redis client instance with your Redis Labs credentials
const redisClient = Redis.createClient({
  password: "QktSCoIEaWQbHQtrs6FnwAhTb606LikI",
  socket: {
    host: "redis-14666.c280.us-central1-2.gce.cloud.redislabs.com",
    port: 14666,
  },
});

// Handle connection events (optional)
redisClient.on("connect", () => {
  console.log("Connected to Redis server");
});

redisClient.on("error", (error) => {
  console.error("Redis connection error:", error);
});

// Export the Redis client to use it in other parts of your application
export default redisClient;
