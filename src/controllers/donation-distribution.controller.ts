import Joi from "joi";
import express from "express";
import mongoose from "mongoose";
import { BodyHandler } from "../middlewares/BodyHandler.js";
import { QueryHandler } from "../middlewares/QueryHandler.js";
import { AsyncHandler } from "../middlewares/AsyncHandler.js";
import { DonationDistributionService } from "../services/donation-distribution.service.js";

// Schema de validação para criação de distribuição
const createDistributionSchema = Joi.object({
  donationId: Joi.string().required().pattern(/^[0-9a-fA-F]{24}$/),
  familyId: Joi.string().required().pattern(/^[0-9a-fA-F]{24}$/),
  quantity: Joi.number().required().min(0.01),
  distributionDate: Joi.date().optional(),
  notes: Joi.string().optional().max(1000).trim(),
  status: Joi.string().valid('pending', 'delivered', 'cancelled').optional()
});

// Schema de validação para atualização de distribuição
const updateDistributionSchema = Joi.object({
  quantity: Joi.number().optional().min(0.01),
  distributionDate: Joi.date().optional(),
  notes: Joi.string().optional().max(1000).trim(),
  status: Joi.string().valid('pending', 'delivered', 'cancelled').optional()
});

// Schema de validação para distribuição múltipla
const distributeToFamiliesSchema = Joi.object({
  distributions: Joi.array().items(
    Joi.object({
      familyId: Joi.string().required().pattern(/^[0-9a-fA-F]{24}$/),
      quantity: Joi.number().required().min(0.01),
      notes: Joi.string().optional().max(1000).trim()
    })
  ).required().min(1)
});

// Schema para query parameters
const querySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  donationId: Joi.string().optional().pattern(/^[0-9a-fA-F]{24}$/),
  familyId: Joi.string().optional().pattern(/^[0-9a-fA-F]{24}$/),
  status: Joi.string().valid('pending', 'delivered', 'cancelled').optional()
});

// Listar distribuições com filtros
export const getDistributions = [
  QueryHandler(querySchema),
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const { page = 1, limit = 10, donationId, familyId, status } = req.query as any;
      
      const filters: any = { deleted: false };
      if (donationId) filters.donationId = donationId;
      if (familyId) filters.familyId = familyId;
      if (status) filters.status = status;

      const distributionService = new DonationDistributionService();
      const result = await distributionService.paginate({
        filters,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
      });

      res.status(200).json({
        message: "Distribuições listadas com sucesso",
        data: result
      });
    } catch (error) {
      res.status(500).json({
        message: "Erro interno do servidor ao listar distribuições",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  }),
];

// Buscar distribuições de uma doação específica
export const getDistributionsByDonation = [
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const { donationId } = req.params;
      const distributionService = new DonationDistributionService();
      const distributions = await distributionService.list({
        filters: { donationId }
      });

      res.status(200).json({
        message: "Distribuições da doação listadas com sucesso",
        data: distributions
      });
    } catch (error) {
      res.status(500).json({
        message: "Erro interno do servidor ao buscar distribuições",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  }),
];

// Buscar histórico de doações de uma família
export const getDistributionsByFamily = [
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const { familyId } = req.params;
      const distributionService = new DonationDistributionService();
      const distributions = await distributionService.list({
        filters: { familyId }
      });

      res.status(200).json({
        message: "Histórico de doações da família listado com sucesso",
        data: distributions
      });
    } catch (error) {
      res.status(500).json({
        message: "Erro interno do servidor ao buscar histórico",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  }),
];

// Buscar distribuição por ID
export const getDistributionById = [
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const distributionService = new DonationDistributionService();
      const distribution = await distributionService.findById(id);

      if (!distribution) {
        res.status(404).json({
          message: "Distribuição não encontrada"
        });
        return;
      }

      res.status(200).json({
        message: "Distribuição encontrada com sucesso",
        data: distribution
      });
    } catch (error) {
      res.status(500).json({
        message: "Erro interno do servidor ao buscar distribuição",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  }),
];

// Criar nova distribuição
export const createDistribution = [
  BodyHandler(createDistributionSchema),
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const distributionService = new DonationDistributionService();
      const distribution = await distributionService.insert(req.body);

      res.status(201).json({
        message: "Distribuição criada com sucesso",
        data: distribution
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("not_found")) {
          res.status(404).json({
            message: error.message
          });
          return;
        }
        if (error.message.includes("insufficient_quantity")) {
          res.status(400).json({
            message: error.message
          });
          return;
        }
      }
      
      res.status(500).json({
        message: "Erro interno do servidor ao criar distribuição",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  }),
];

// Distribuir doação para múltiplas famílias
export const distributeToFamilies = [
  BodyHandler(distributeToFamiliesSchema),
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const { donationId } = req.params;
      const { distributions } = req.body;

      const distributionService = new DonationDistributionService();
      const results = [];
      for (const dist of distributions) {
        const distribution = await distributionService.insert({
          donationId: new mongoose.Types.ObjectId(donationId),
          familyId: new mongoose.Types.ObjectId(dist.familyId),
          quantity: dist.quantity,
          notes: dist.notes,
          distributionDate: new Date(),
          status: 'pending'
        });
        results.push(distribution);
      }

      res.status(201).json({
        message: "Doação distribuída com sucesso",
        data: results
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("not_found")) {
          res.status(404).json({
            message: error.message
          });
          return;
        }
        if (error.message.includes("insufficient_quantity")) {
          res.status(400).json({
            message: error.message
          });
          return;
        }
      }
      
      res.status(500).json({
        message: "Erro interno do servidor ao distribuir doação",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  }),
];

// Atualizar distribuição
export const updateDistribution = [
  BodyHandler(updateDistributionSchema),
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const distributionService = new DonationDistributionService();
      const distribution = await distributionService.updateOne(id, req.body);

      res.status(200).json({
        message: "Distribuição atualizada com sucesso",
        data: distribution
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("not_found")) {
          res.status(404).json({
            message: error.message
          });
          return;
        }
        if (error.message.includes("insufficient_quantity")) {
          res.status(400).json({
            message: error.message
          });
          return;
        }
      }
      
      res.status(500).json({
        message: "Erro interno do servidor ao atualizar distribuição",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  }),
];

// Cancelar distribuição
export const cancelDistribution = [
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const distributionService = new DonationDistributionService();
      const distribution = await distributionService.updateOne(id, { status: 'cancelled' });

      res.status(200).json({
        message: "Distribuição cancelada com sucesso",
        data: distribution
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("not_found")) {
        res.status(404).json({
          message: error.message
        });
        return;
      }
      
      res.status(500).json({
        message: "Erro interno do servidor ao cancelar distribuição",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  }),
];

// Confirmar entrega da distribuição
export const confirmDelivery = [
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const distributionService = new DonationDistributionService();
      const distribution = await distributionService.updateOne(id, { 
        status: 'delivered'
      });

      res.status(200).json({
        message: "Entrega confirmada com sucesso",
        data: distribution
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("not_found")) {
        res.status(404).json({
          message: error.message
        });
        return;
      }
      
      res.status(500).json({
        message: "Erro interno do servidor ao confirmar entrega",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  }),
];

// Deletar distribuição
export const deleteDistribution = [
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const distributionService = new DonationDistributionService();
      await distributionService.deleteOne({ filters: { _id: id } });

      res.status(204).send();
    } catch (error) {
      res.status(500).json({
        message: "Erro interno do servidor ao deletar distribuição",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  }),
];

// Obter estatísticas de distribuição de uma doação
export const getDonationDistributionStats = [
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const { donationId } = req.params;
      const distributionService = new DonationDistributionService();
      const stats = await distributionService.getDonationStats(donationId);

      res.status(200).json({
        message: "Estatísticas de distribuição obtidas com sucesso",
        data: stats
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("not_found")) {
        res.status(404).json({
          message: error.message
        });
        return;
      }
      
      res.status(500).json({
        message: "Erro interno do servidor ao obter estatísticas",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  }),
];
