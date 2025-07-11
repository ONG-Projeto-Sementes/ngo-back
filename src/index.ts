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
const PORT = process.env.PORT || 8080;

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
  res.status(200).json({
    status: "OK",
  });
});

app.use("/", router());

app.use(ErrorHandler);

void connection(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });
});
