import "dotenv/config";
import { createClient } from "redis";

const client = createClient({
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    connectTimeout: 5000,
    reconnectStrategy: false,
  },
});

client.on("error", (err) => {
  console.log("Redis Client Error", err);
});

export const connectRedis = async () => {
  try {
    await client.connect();
    console.log("Redis is connected");
  } catch (error) {
    console.error("Redis connection failed:", error);
    throw error;
  }
};

export default client;