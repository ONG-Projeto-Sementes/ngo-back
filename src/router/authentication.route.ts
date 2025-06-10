import express from "express";

import {
  register,
  login,
  isAuthenticatedHandler,
  logout,
} from "../controllers/authentication.controller.js";
import { isAuthenticated } from "../middlewares/isAuthenticated.js";

export default (router: express.Router) => {
  router.post("/auth/register", ...register);
  router.post("/auth/login", ...login);
  router.get("/auth/isAuthenticated", isAuthenticated, isAuthenticatedHandler);
  router.post("/auth/logout", logout);
};
