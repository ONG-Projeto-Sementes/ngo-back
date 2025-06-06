import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import cors from 'cors';
import express from 'express';
import bodyParser from 'body-parser';
import compression from 'compression';
import router from './router/index.js';
import cookieParser from 'cookie-parser';
import mongoose, { mongo } from 'mongoose';

const app = express();

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);

app.use(compression());
app.use(cookieParser());
app.use(bodyParser.json());

const server = http.createServer(app);

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

const MONGO_URL = process.env.MONGO_URL as string;

mongoose.Promise = Promise;
mongoose.connect(MONGO_URL);
mongoose.connection.on('error', (error: Error) =>
    console.error('MongoDB connection error:', error)
);

app.use('/', router())
