import Joi from "joi";
import express from "express";

import familyService from "../services/family.service.js";
import { AsyncHandler } from "../middlewares/AsyncHandler.js";
import { BodyHandler } from "../middlewares/BodyHandler.js";
import { BeneficiaryService } from "../services/beneficiary.service.js";
import { NotFoundError } from "errors/not-found.error.js";

const beneficiaryService = new BeneficiaryService();

export const getAllFamilies = AsyncHandler(
  async (req: express.Request, res: express.Response) => {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const search = (req.query.search as string) || "";

      let filters = {};
      
      if (search) {
        filters = {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { city: { $regex: search, $options: "i" } },
            { neighborhood: { $regex: search, $options: "i" } },
            { contact: { $regex: search, $options: "i" } }
          ]
        };
      }

      const result = await familyService.paginate({
        filters,
        page,
        limit
      });

      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        message: "Erro interno do servidor ao buscar famílias",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
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
    try {
      const family = await familyService.insert(req.body);
      res.status(201).json({
        message: "Família criada com sucesso",
        data: family
      });
    } catch (error) {
      res.status(500).json({
        message: "Erro interno do servidor ao criar família",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
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
    try {
      const { id } = req.params;
      
      // Verificar se a família existe
      const family = await familyService.findById(id);
      if (!family) {
        res.status(404).json({
          message: "Família não encontrada"
        });
        return;
      }

      const beneficiary = await beneficiaryService.insert({
        ...req.body,
        family: id,
      });
      
      res.status(201).json({
        message: "Beneficiário criado com sucesso",
        data: beneficiary
      });
    } catch (error) {
      res.status(500).json({
        message: "Erro interno do servidor ao criar beneficiário",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  }),
];

export const getBeneficiariesByFamilyId = AsyncHandler(
  async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      
      // Verificar se a família existe
      const family = await familyService.findById(id);
      if (!family) {
        res.status(404).json({
          message: "Família não encontrada"
        });
        return;
      }

      const beneficiaries = await beneficiaryService.list({ filters: { family: id } });
      res.status(200).json({
        message: "Beneficiários encontrados com sucesso",
        data: beneficiaries
      });
    } catch (error) {
      res.status(500).json({
        message: "Erro interno do servidor ao buscar beneficiários",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
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
    try {
      const { id } = req.params;
      
      // Verificar se a família existe
      const existingFamily = await familyService.findById(id);
      if (!existingFamily) {
        res.status(404).json({
          message: "Família não encontrada"
        });
        return;
      }

      const updatedFamily = await familyService.updateOne(id, req.body);
      res.status(200).json({
        message: "Família atualizada com sucesso",
        data: updatedFamily
      });
    } catch (error) {
      res.status(500).json({
        message: "Erro interno do servidor ao atualizar família",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  }),
];

export const deleteFamily = AsyncHandler(
  async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      
      // Verificar se a família existe
      const family = await familyService.findById(id);
      if (!family) {
        res.status(404).json({
          message: "Família não encontrada"
        });
        return;
      }

      await familyService.deleteOneById(id);
      res.status(200).json({
        message: "Família excluída com sucesso"
      });
    } catch (error) {
      res.status(500).json({
        message: "Erro interno do servidor ao excluir família",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  },
);

export const getFamilyById = AsyncHandler(
  async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const family = await familyService.findById(id);
      
      if (!family) {
        res.status(404).json({
          message: "Família não encontrada"
        });
        return;
      }

      res.status(200).json({
        message: "Família encontrada com sucesso",
        data: family
      });
    } catch (error) {
      res.status(500).json({
        message: "Erro interno do servidor ao buscar família",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  },
);

// Buscar família por ID com histórico de doações
export const getFamilyWithDonationHistory = [
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const family = await familyService.findByIdWithDonationHistory(id);

      res.status(200).json({
        message: "Família com histórico de doações encontrada com sucesso",
        data: family
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("not_found")) {
        res.status(404).json({
          message: error.message
        });
        return;
      }
      
      res.status(500).json({
        message: "Erro interno do servidor ao buscar família",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  }),
];

// Listar famílias com estatísticas de doações
export const getFamiliesWithDonationStats = [
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const { search, city, neighborhood } = req.query as any;
      
      const filters: any = {};
      if (search) {
        filters.$or = [
          { name: { $regex: search, $options: 'i' } },
          { contact: { $regex: search, $options: 'i' } }
        ];
      }
      if (city) filters.city = { $regex: city, $options: 'i' };
      if (neighborhood) filters.neighborhood = { $regex: neighborhood, $options: 'i' };

      const families = await familyService.findWithDonationStats(filters);

      res.status(200).json({
        message: "Famílias com estatísticas de doações listadas com sucesso",
        data: families
      });
    } catch (error) {
      res.status(500).json({
        message: "Erro interno do servidor ao listar famílias",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  }),
];

// Obter estatísticas gerais de famílias
export const getFamilyStats = [
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const stats = await familyService.getFamilyStats();

      res.status(200).json({
        message: "Estatísticas de famílias obtidas com sucesso",
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        message: "Erro interno do servidor ao obter estatísticas",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  }),
];

// Listar famílias com paginação avançada
export const getFamiliesWithPagination = [
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const { page, limit, search, city, neighborhood } = req.query as any;
      
      const result = await familyService.listWithPagination({
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
        search,
        city,
        neighborhood
      });

      res.status(200).json({
        message: "Famílias listadas com sucesso",
        data: result
      });
    } catch (error) {
      res.status(500).json({
        message: "Erro interno do servidor ao listar famílias",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  }),
];

// Obter histórico de doações de uma família
export const getFamilyDonationHistory = [
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const history = await familyService.getDonationHistory(id);

      res.status(200).json({
        success: true,
        message: "Histórico de doações obtido com sucesso",
        data: history
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          message: error.message
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor ao obter histórico de doações",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  })
];
