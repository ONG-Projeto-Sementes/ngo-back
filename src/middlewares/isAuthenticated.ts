import express from "express";
import { merge } from "lodash-es";
import UserService from "../services/user.service.js";
import { UnauthorizedError } from "../errors/unauthorized.error.js";

export const isAuthenticated = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  const sessionToken = req.cookies["sessionToken"];

  if (!sessionToken) {
    throw new UnauthorizedError("unauthenticated", "Sem sessão ativa");
  }

  const existingUser = await UserService.findOne({
    select: "+authentication.sessionToken",
    filters: {
      "authentication.sessionToken": sessionToken,
    },
  });

  if (!existingUser) {
    throw new UnauthorizedError("unauthenticated", "Sessão não encontrada");
  }

  merge(req, { identity: existingUser });

  next();
};
