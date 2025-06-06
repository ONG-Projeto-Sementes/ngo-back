import express from "express";
import { healthCheck } from "../controllers/health.js";

export default (router: express.Router) => {
  router.get("/health", healthCheck);
};
