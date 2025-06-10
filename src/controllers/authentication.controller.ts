import Joi from "joi";
import express from "express";

import { UserService } from "../services/user.service.js";
import { BodyHandler } from "../middlewares/BodyHandler.js";
import { AsyncHandler } from "../middlewares/AsyncHandler.js";
import { BadRequestError } from "../errors/bad-request.error.js";
import { UnauthorizedError } from "../errors/unauthorized.error.js";

const userService = new UserService();

export const login = [
  BodyHandler(
    Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    }),
  ),
  AsyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const authenticatedUser = await userService.authenticateUser(
      email,
      password,
    );
    if (!authenticatedUser) {
      throw new UnauthorizedError(
        "invalid_credentials",
        "Credenciais inválidas",
      );
    }

    res.cookie("sessionToken", authenticatedUser.authentication.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    res.status(200).json(authenticatedUser);
  }),
];

export const register = [
  BodyHandler(
    Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
      username: Joi.string().min(3).max(30).required(),
    }),
  ),
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    const { email, password, username } = req.body;

    const newUser = await userService.registerUser({
      email,
      password,
      username,
    });
    if (!newUser) {
      throw new BadRequestError("User already exists", "user_already_exists");
    }

    res.status(200).json(newUser);
  }),
];

export const isAuthenticatedHandler = (
  req: express.Request,
  res: express.Response,
): void => {
  const user = req.identity;

  if (!user) {
    throw new UnauthorizedError("not_authenticated", "Usuário não autenticado");
  }

  res.status(200).json({
    _id: user._id,
    username: user.username,
    email: user.email,
  });
};

export const logout = (req: express.Request, res: express.Response) => {
  res.clearCookie("sessionToken", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
  res.sendStatus(200);
  return;
};
