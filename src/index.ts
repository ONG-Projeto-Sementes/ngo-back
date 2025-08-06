import dotenv from "dotenv";

dotenv.config();

import cors from "cors";
import express from "express";
import bodyParser from "body-parser";
import compression from "compression";
import cookieParser from "cookie-parser";

import router from "./router/index.js";
import { connection } from "./core/connection.js";
import { ErrorHandler } from "./middlewares/ErrorHandler.js";

const app = express();
const PORT = Number(process.env.PORT) || 8080;

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://ngo-front-production.up.railway.app",
];

app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  }),
);

app.use(compression());
app.use(cookieParser());
app.use(bodyParser.json());

app.get("/health", (req, res) => {
  console.log("🔍 Health check requested");
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    port: PORT,
    env: process.env.NODE_ENV || 'development'
  });
});

app.use("/", router());

app.use(ErrorHandler);

// Add error handling for unhandled promises and exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server first
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🔗 Health endpoint: http://localhost:${PORT}/health`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});

// Then try to connect to the database (non-blocking)
void connection(() => {
  console.log("Database connected successfully");
});
