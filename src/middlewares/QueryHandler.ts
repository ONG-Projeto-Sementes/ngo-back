import { AnySchema } from "joi";
import express, { NextFunction } from "express";
import { BadRequestError } from "../errors/bad-request.error.js";
import { ServerError } from "../errors/server.error.js";

export const QueryHandler = (schema: AnySchema) => {
  return async (
    req: express.Request,
    _res: express.Response,
    next: NextFunction,
  ) => {
    try {
      const options = {
        abortEarly: false,
        allowUnknown: true,
        convert: true,
        stripUnknown: true,
      };

      if (schema) {
        const result = await schema.validate(req.query, options);
        if (result.error) {
          throw new BadRequestError(
            "invalid_query_params",
            "Parametros de busca inválidos.",
          );
        }
      }
    } catch (e: unknown) {
      throw new ServerError("query_handler_error", (e as Error).message);
    } finally {
      next();
    }
  };
};
