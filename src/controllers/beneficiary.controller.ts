import Joi from "joi";
import express from "express";

import { BodyHandler } from "../middlewares/BodyHandler.js";
import { AsyncHandler } from "../middlewares/AsyncHandler.js";
import { BeneficiaryService } from "../services/beneficiary.service.js";

const beneficiaryService = new BeneficiaryService();

export const getBeneficiaries = AsyncHandler(
  async (req: express.Request, res: express.Response) => {
    res.status(200).json(await beneficiaryService.list({}));
  },
);

export const deleteBeneficiary = AsyncHandler(
  async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    await beneficiaryService.deleteOne({ filters: { _id: id } });
    res.status(204).send();
  },
);

export const updateBeneficiary = [
  BodyHandler(
    Joi.object({
      name: Joi.string().required(),
      birthDate: Joi.date().required(),
      cpf: Joi.string().optional(),
    }),
  ),
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    res.status(200).json(await beneficiaryService.updateOne(id, req.body));
  }),
];

export const getBeneficiaryById = AsyncHandler(
  async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    res
      .status(200)
      .json(await beneficiaryService.findOne({ filters: { _id: id } }));
  },
);
