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
import * as process from "node:process";

const app = express();
const PORT = process.env.PORT || 8000;

app.use(
  cors({
    credentials: true,
    origin: [
      "http://localhost:5173",
      "https://ngo-front-production.up.railway.app",
    ],
  }),
);

app.use(compression());
app.use(cookieParser());
app.use(bodyParser.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    uptime: process.uptime(),
  });
});

app.use("/", router());

app.use(ErrorHandler);

void connection(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });
});
