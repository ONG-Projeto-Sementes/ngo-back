import Joi from "joi";
import express from "express";

import { FamilyService } from "../services/family.service.js";
import { AsyncHandler } from "../middlewares/AsyncHandler.js";
import { BodyHandler } from "../middlewares/BodyHandler.js";
import { BeneficiaryService } from "../services/beneficiary.service.js";

const familyService = new FamilyService();
const beneficiaryService = new BeneficiaryService();

export const getAllFamilies = AsyncHandler(
  async (req: express.Request, res: express.Response) => {
    res.status(200).json(await familyService.list({}));
  },
);

export const createFamily = [
  BodyHandler(
    Joi.object({
      name: Joi.string().required(),
      city: Joi.string().required(),
      address: Joi.string().optional(),
      neighborhood: Joi.string().required(),
      contact: Joi.string().optional(),
    }),
  ),
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    res.status(201).json(await familyService.insert(req.body));
  }),
];

export const createBeneficiaryByFamilyId = [
  BodyHandler(
    Joi.object({
      name: Joi.string().required(),
      birthDate: Joi.date().required(),
      cpf: Joi.string().optional(),
    }),
  ),
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    res.status(201).json(await beneficiaryService.insert({ ...req.body, familyId: req.params.familyId }));
  }),
];
