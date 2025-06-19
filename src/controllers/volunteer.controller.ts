import Joi from "joi";
import express from "express";

import { BodyHandler } from "../middlewares/BodyHandler.js";
import { AsyncHandler } from "../middlewares/AsyncHandler.js";
import { VolunteerService } from "../services/volunteer.service.js";
import { FileHandler } from "../middlewares/FileHandler.js";

const volunteerService = new VolunteerService();

export const getVolunteers = [
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    res.status(200).json(await volunteerService.list({}));
  }),
];

export const createVolunteer = [
  FileHandler([{ name: "image", maxCount: 1 }]),
  BodyHandler(
    Joi.object({
      name: Joi.string().required(),
      cpf: Joi.string().optional(),
      contact: Joi.string().optional(),
      birthDate: Joi.date().optional(),
    }),
  ),
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    res
      .status(201)
      .json(
        await volunteerService.insertOneWithImage(
          req.body,
          (req.files as { image: Express.Multer.File[] })?.image?.[0],
        ),
      );
  }),
];

export const updateVolunteer = [
  FileHandler([{ name: "image", maxCount: 1 }]),
  BodyHandler(
    Joi.object({
      name: Joi.string().optional(),
      cpf: Joi.string().optional(),
      contact: Joi.string().optional(),
      birthDate: Joi.date().optional(),
    }),
  ),
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    const { id } = req.params;

    res
      .status(200)
      .json(
        await volunteerService.updateOneWithImage(
          id,
          req.body,
          (req.files as { image: Express.Multer.File[] })?.image?.[0],
        ),
      );
  }),
];
