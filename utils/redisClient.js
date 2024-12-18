import Redis from "redis";

// Create a Redis client instance with your Redis Labs credentials
const redisClient = Redis.createClient({
  password: "MPk7Fo2AvhfRUxGoVkUMT5FD8yyN0OMx",
  socket: {
    host: "redis-10974.c99.us-east-1-4.ec2.redns.redis-cloud.com",
    port: 10974,
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
