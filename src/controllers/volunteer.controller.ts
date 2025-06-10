import Joi from "joi";
import express from "express";

import { BodyHandler } from "../middlewares/BodyHandler.js";
import { AsyncHandler } from "../middlewares/AsyncHandler.js";
import { VolunteerService } from "../services/volunteer.service.js";

const volunteerService = new VolunteerService();

export const getVolunteers = [
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    res.status(200).json(await volunteerService.list({}));
  }),
];

export const createVolunteer = [
  BodyHandler(
    Joi.object({
      name: Joi.string().required(),
      cpf: Joi.string().optional(),
      contact: Joi.string().optional(),
    }),
  ),
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    res.status(201).json(await volunteerService.insert(req.body));
  }),
];
