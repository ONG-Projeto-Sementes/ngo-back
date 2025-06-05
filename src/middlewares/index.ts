import express from 'express';
import { get, merge } from 'lodash-es';

import { getUserBySessionToken } from '../db/users.js';

export const isOwner = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUserId = get(req, 'identity._id') as string | undefined;

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

export const isAuthenticated = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<void> => {
  try {
    const sessionToken = req.cookies['sessionToken'];

    if (!sessionToken) {
      res.sendStatus(403);
      return;
    }

    const existingUser = await getUserBySessionToken(sessionToken).select(
      '+authentication.sessionToken'
    );

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
