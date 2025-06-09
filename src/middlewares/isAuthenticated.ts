import express from "express";
import { merge } from "lodash-es";
import UserService from "../services/user.service.js";

export const isAuthenticated = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): Promise<void> => {
  try {
    const sessionToken = req.cookies["sessionToken"];

    if (!sessionToken) {
      res.sendStatus(403);
      return;
    }

    const existingUser = await UserService.findOne({
      select: "+authentication.sessionToken",
      filters: {
        "authentication.sessionToken": sessionToken,
      },
    });

    if (!existingUser) {
      res.sendStatus(403);
      return;
    }

    merge(req, { identity: existingUser });

    next();
    return;
  } catch (error) {
    console.log(error);
    res.sendStatus(400);
    return;
  }
};
