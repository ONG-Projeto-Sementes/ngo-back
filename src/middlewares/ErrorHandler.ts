import express, { ErrorRequestHandler } from "express";
import { CustomError } from "../errors/custom.error.js";
import { logger } from "../logging/logger.js";

export const ErrorHandler: ErrorRequestHandler = async (
  err: unknown,
  _req: express.Request,
  res: express.Response,
  _next: express.NextFunction,
) => {
  if (err instanceof CustomError) {
    const { name, code, message } = err;
    logger.error(`An error occurred: ${message}`);
    res.status(code).send({
      name,
      message,
    });
  } else {
    res.status(500).send({
      name: "internal_server_error",
      message: "Internal server error",
    });
  }
};
