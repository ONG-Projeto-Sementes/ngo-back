import Joi from "joi";
import express from "express";

import { BodyHandler } from "../middlewares/BodyHandler.js";
import { AsyncHandler } from "../middlewares/AsyncHandler.js";
import { QueryHandler } from "../middlewares/QueryHandler.js";
import DonationService from "../services/donation.service.js";

// Schema de validação para criação de doação
const createDonationSchema = Joi.object({
  donorName: Joi.string().required().min(2).max(200).trim(),
  donorContact: Joi.string().optional().max(100).trim(),
  categoryId: Joi.string().required().pattern(/^[0-9a-fA-F]{24}$/),
  quantity: Joi.number().required().min(0.01),
  unit: Joi.string().required().min(1).max(50).trim(),
  description: Joi.string().optional().max(1000).trim(),
  estimatedValue: Joi.number().optional().min(0),
  receivedDate: Joi.date().optional(),
  status: Joi.string().valid('pending', 'received', 'distributed', 'expired').optional(),
  images: Joi.array().items(Joi.string()).optional(),
  notes: Joi.string().optional().max(1000).trim()
});

// Schema de validação para atualização de doação
const updateDonationSchema = Joi.object({
  donorName: Joi.string().optional().min(2).max(200).trim(),
  donorContact: Joi.string().optional().max(100).trim(),
  categoryId: Joi.string().optional().pattern(/^[0-9a-fA-F]{24}$/),
  quantity: Joi.number().optional().min(0.01),
  unit: Joi.string().optional().min(1).max(50).trim(),
  description: Joi.string().optional().max(1000).trim(),
  estimatedValue: Joi.number().optional().min(0),
  receivedDate: Joi.date().optional(),
  status: Joi.string().valid('pending', 'received', 'distributed', 'expired').optional(),
  images: Joi.array().items(Joi.string()).optional(),
  notes: Joi.string().optional().max(1000).trim()
});

// Schema para query parameters
const querySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  search: Joi.string().optional().trim(),
  categoryId: Joi.string().optional().pattern(/^[0-9a-fA-F]{24}$/),
  status: Joi.string().valid('pending', 'received', 'distributed', 'expired').optional(),
  donorName: Joi.string().optional().trim()
});

// Schema para atualização de status
const updateStatusSchema = Joi.object({
  status: Joi.string().valid('pending', 'received', 'distributed', 'expired').required()
});

export const getDonations = [
  QueryHandler(querySchema),
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const { page = 1, limit = 10, search, categoryId, status, donorName } = req.query as any;
      
      let filters: any = {};
      
      // Filtro por categoria
      if (categoryId) {
        filters.categoryId = categoryId;
      }
      
      // Filtro por status
      if (status) {
        filters.status = status;
      }
      
      // Filtro por nome do doador
      if (donorName) {
        filters.donorName = { $regex: donorName, $options: 'i' };
      }
      
      // Filtro de busca geral (nome do doador ou descrição)
      if (search) {
        filters.$or = [
          { donorName: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      if (page && limit) {
        const result = await DonationService.paginate({
          filters,
          page: Number(page),
          limit: Number(limit)
        });

        // Populate das categorias no resultado paginado
        const populatedData = await Promise.all(
          result.data.map(async (donation) => {
            return await DonationService.findByIdWithCategory(donation._id.toString());
          })
        );

        res.status(200).json({
          message: "Doações listadas com sucesso",
          data: {
            ...result,
            data: populatedData
          }
        });
      } else {
        const donations = await DonationService.findWithCategory(filters);
        res.status(200).json({
          message: "Doações listadas com sucesso",
          data: donations
        });
      }
    } catch (error) {
      throw error;
    }
  }),
];

export const getDonationById = [
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const donation = await DonationService.findByIdWithCategory(id);
      
      res.status(200).json({
        message: "Doação encontrada com sucesso",
        data: donation
      });
    } catch (error) {
      throw error;
    }
  }),
];

export const getDonationsByCategory = [
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const { categoryId } = req.params;
      const donations = await DonationService.findByCategory(categoryId);
      
      res.status(200).json({
        message: "Doações da categoria listadas com sucesso",
        data: donations
      });
    } catch (error) {
      throw error;
    }
  }),
];

export const getDonationsByStatus = [
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const { status } = req.params;
      const donations = await DonationService.findByStatus(status as any);
      
      res.status(200).json({
        message: `Doações com status '${status}' listadas com sucesso`,
        data: donations
      });
    } catch (error) {
      throw error;
    }
  }),
];

export const getDonationStats = [
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const stats = await DonationService.getDonationStats();
      
      res.status(200).json({
        message: "Estatísticas de doações obtidas com sucesso",
        data: stats
      });
    } catch (error) {
      throw error;
    }
  }),
];

export const getDonationStatsByCategory = [
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const stats = await DonationService.getStatsByCategory();
      
      res.status(200).json({
        message: "Estatísticas por categoria obtidas com sucesso",
        data: stats
      });
    } catch (error) {
      throw error;
    }
  }),
];

export const createDonation = [
  BodyHandler(createDonationSchema),
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const donation = await DonationService.insert(req.body);
      const populatedDonation = await DonationService.findByIdWithCategory(donation._id.toString());
      
      res.status(201).json({
        message: "Doação criada com sucesso",
        data: populatedDonation
      });
    } catch (error) {
      throw error;
    }
  }),
];

export const updateDonation = [
  BodyHandler(updateDonationSchema),
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const donation = await DonationService.updateOne(id, req.body);
      const populatedDonation = await DonationService.findByIdWithCategory(donation!._id.toString());
      
      res.status(200).json({
        message: "Doação atualizada com sucesso",
        data: populatedDonation
      });
    } catch (error) {
      throw error;
    }
  }),
];

export const updateDonationStatus = [
  BodyHandler(updateStatusSchema),
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const donation = await DonationService.updateStatus(id, status);
      const populatedDonation = await DonationService.findByIdWithCategory(donation!._id.toString());
      
      res.status(200).json({
        message: "Status da doação atualizado com sucesso",
        data: populatedDonation
      });
    } catch (error) {
      throw error;
    }
  }),
];

export const deleteDonation = [
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      await DonationService.deleteOne({ filters: { _id: id } });
      res.status(204).send();
    } catch (error) {
      throw error;
    }
  }),
];
