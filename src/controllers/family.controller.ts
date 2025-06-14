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
      degreeOfKinship: Joi.string().optional(),
      genre: Joi.string().valid("M", "F", "O").optional(),
      cpf: Joi.string().optional(),
    }),
  ),
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    res.status(201).json(
      await beneficiaryService.insert({
        ...req.body,
        family: req.params.id,
      }),
    );
  }),
];

export const getBeneficiariesByFamilyId = AsyncHandler(
  async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    res
      .status(200)
      .json(await beneficiaryService.list({ filters: { family: id } }));
  },
);

export const updateFamily = [
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
    const { id } = req.params;
    res.status(200).json(await familyService.updateOne(id, req.body));
  }),
];

export const deleteFamily = AsyncHandler(
  async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    await familyService.deleteOneById(id);
    res.status(204).send();
  },
);

export const getFamilyById = AsyncHandler(
  async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    res.status(200).json(await familyService.findById(id));
  },
);
