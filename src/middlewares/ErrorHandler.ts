import express from "express";
import { CustomError } from "../errors/custom.error.js";
import { logger } from "../logging/logger.js";

export const ErrorHandler = async (
  err: unknown,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  if (err instanceof CustomError) {
    const { name, code, message } = err;
    logger.error(`An error occurred: ${message}`);
    return res.status(code).send({
      name,
      message,
    });
  } else {
    return res.status(500).send({
      name: 'internal_server_error',
      message: 'Internal server error',
    });
  }
};
