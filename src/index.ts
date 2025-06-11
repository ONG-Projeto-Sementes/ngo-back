import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express from "express";
import bodyParser from "body-parser";
import compression from "compression";
import router from "./router/index.js";
import cookieParser from "cookie-parser";
import {connection} from "./core/connection.js";
import { ErrorHandler } from "./middlewares/ErrorHandler.js";

const app = express();
const PORT = process.env.PORT || 8000;


void connection(() => {
    app.use(
      cors({
        origin: "http://localhost:5173",
        credentials: true,
      }),
    );

    app.use(compression());
    app.use(cookieParser());
    app.use(bodyParser.json());

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });

    app.get("/health", (req, res) => {
      res.status(200).json({ status: "OK", uptime: process.uptime() });
    });

    app.use("/", router());

    app.use(ErrorHandler);
})

