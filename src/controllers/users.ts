import Joi from "joi";
import express from "express";

import { UserService } from "../services/user.service.js";
import { AsyncHandler } from "../middlewares/AsyncHandler.js";
import { NotFoundError } from "../errors/not-found.error.js";
import { BodyHandler } from "../middlewares/BodyHandler.js";

const userService = new UserService();

export const getAllUsers = AsyncHandler(
  async (req: express.Request, res: express.Response) => {
    res.status(200).json(await userService.list({}));
  },
);

export const deleteUser = AsyncHandler(
  async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    const deletedUser = await userService.deleteOne({ filters: { _id: id } });

    if (!deletedUser) {
      throw new NotFoundError("user_not_found", "Usuário não encontrado");
    }

    res.status(200).json(deletedUser);
  },
);

export const updateUser = [
  BodyHandler(
    Joi.object({
      username: Joi.string().min(3).max(30).required(),
    }),
  ),
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    const { username } = req.body;

    const updatedUser = await userService.updateOne(id, { username });
    if (!updatedUser) {
      throw new NotFoundError("user_not_found", "Usuário não encontrado");
    }

    res.status(200).json(updatedUser);
  }),
];
