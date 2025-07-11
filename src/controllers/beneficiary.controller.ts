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
      degreeOfKinship: Joi.string().optional(),
      genre: Joi.string().valid("M", "F", "O").optional(),
      cpf: Joi.string().optional(),
    }),
  ),
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      
      // Verificar se o beneficiário existe
      const existingBeneficiary = await beneficiaryService.findOne({ filters: { _id: id } });
      if (!existingBeneficiary) {
        res.status(404).json({
          message: "Beneficiário não encontrado"
        });
        return;
      }

      const updatedBeneficiary = await beneficiaryService.updateOne(id, req.body);
      res.status(200).json({
        message: "Beneficiário atualizado com sucesso",
        data: updatedBeneficiary
      });
    } catch (error) {
      res.status(500).json({
        message: "Erro interno do servidor ao atualizar beneficiário",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
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
