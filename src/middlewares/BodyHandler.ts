import { AnySchema, ValidationResult } from "joi";
import express, { NextFunction } from "express";
import { BadRequestError } from "../errors/bad-request.error.js";

export const BodyHandler = <M extends object>(schema: AnySchema) => {
  return (req: express.Request, _res: express.Response, next: NextFunction) => {
    const options = {
      abortEarly: false,
      allowUnknown: true,
      convert: true,
    };

    const { value, error }: ValidationResult<M> = schema.validate(
      req.body,
      options
    );
    if (error) {
      throw new BadRequestError(error.name, error.message);
    }

    req.body = value;
    next();
  };
};
