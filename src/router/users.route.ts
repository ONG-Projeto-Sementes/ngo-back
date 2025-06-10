import express from "express";

import { deleteUser, getAllUsers, updateUser } from "../controllers/users.controller.js";
import { isOwner } from "../middlewares/isOwner.js";

export default (router: express.Router) => {
  router.get("/users", getAllUsers);
  router.delete("/users/:id", isOwner, deleteUser);
  router.patch("/users/:id", isOwner, updateUser);
};
