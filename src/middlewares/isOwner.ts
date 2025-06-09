import express from "express";
import { get } from "lodash-es";

export const isOwner = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUserId = get(req, "identity._id") as string | undefined;

    if (!currentUserId) {
      res.sendStatus(403);
      return;
    }

    if (currentUserId.toString() !== id.toString()) {
      res.sendStatus(403);
      return;
    }

    next();
    return;
  } catch (error) {
    console.log(error);
    res.sendStatus(400);
    return;
  }
};
