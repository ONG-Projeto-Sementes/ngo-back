import Joi from "joi";
import express from "express";
import mongoose from "mongoose";

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
      
      console.log('🔍 Request query params:', req.query);
      console.log('🔍 Extracted params:', { page, limit, search, categoryId, status, donorName });
      
      let filters: any = {};
      
      // Filtro por categoria
      if (categoryId) {
        // Verificar se o categoryId é um ObjectId válido
        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
          console.log('❌ Invalid categoryId format:', categoryId);
          res.status(400).json({
            message: "ID de categoria inválido"
          });
          return;
        }
        filters.categoryId = new mongoose.Types.ObjectId(categoryId);
        console.log('📂 Adding category filter:', categoryId);
      }
      
      // Filtro por status
      if (status) {
        filters.status = status;
        console.log('📋 Adding status filter:', status);
      }
      
      // Filtro por nome do doador
      if (donorName) {
        filters.donorName = { $regex: donorName, $options: 'i' };
        console.log('👤 Adding donor filter:', donorName);
      }
      
      // Filtro de busca geral (nome do doador ou descrição)
      if (search) {
        filters.$or = [
          { donorName: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
        console.log('🔍 Adding search filter:', search);
      }

      console.log('🎯 Final filters object:', JSON.stringify(filters, null, 2));

      if (page && limit) {
        console.log('📄 Using pagination with page:', page, 'limit:', limit);
        const result = await DonationService.paginate({
          filters,
          page: Number(page),
          limit: Number(limit)
        });

        console.log('📊 Pagination result:', {
          total: result.total,
          totalPages: result.totalPages,
          currentPage: result.currentPage,
          dataLength: result.data.length
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
      console.log('📝 Creating donation with data:', req.body);
      console.log('📂 Category ID received:', req.body.categoryId);
      
      const donation = await DonationService.insert(req.body);
      console.log('✅ Donation created with ID:', donation._id);
      
      const populatedDonation = await DonationService.findByIdWithCategory(donation._id.toString());
      console.log('🔗 Populated donation:', populatedDonation);
      
      res.status(201).json({
        message: "Doação criada com sucesso",
        data: populatedDonation
      });
    } catch (error) {
      console.error('❌ Error creating donation:', error);
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

// Buscar doações com estatísticas de distribuição
export const getDonationsWithStats = [
  QueryHandler(querySchema),
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const { page = 1, limit = 10, search, categoryId, status, donorName } = req.query as any;
      
      const filters: any = {};
      if (search) {
        filters.$or = [
          { donorName: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      if (categoryId) filters.categoryId = categoryId;
      if (status) filters.status = status;
      if (donorName) filters.donorName = { $regex: donorName, $options: 'i' };

      const donations = await DonationService.findWithCategoryAndStats(filters);

      res.status(200).json({
        message: "Doações com estatísticas listadas com sucesso",
        data: donations
      });
    } catch (error) {
      res.status(500).json({
        message: "Erro interno do servidor ao listar doações",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  }),
];

// Buscar doação por ID com estatísticas
export const getDonationByIdWithStats = [
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const donation = await DonationService.findByIdWithCategoryAndStats(id);

      res.status(200).json({
        message: "Doação encontrada com sucesso",
        data: donation
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("not_found")) {
        res.status(404).json({
          message: error.message
        });
        return;
      }
      
      res.status(500).json({
        message: "Erro interno do servidor ao buscar doação",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  }),
];

// Distribuir doação para famílias
export const distributeToFamilies = [
  BodyHandler(Joi.object({
    distributions: Joi.array().items(
      Joi.object({
        familyId: Joi.string().required().pattern(/^[0-9a-fA-F]{24}$/),
        quantity: Joi.number().required().min(0.01),
        notes: Joi.string().optional().max(1000).trim()
      })
    ).required().min(1)
  })),
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const { distributions } = req.body;

      const results = await DonationService.distributeToFamilies(id, distributions);

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

// Listar doações com paginação avançada
export const getDonationsWithPagination = [
  QueryHandler(Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    search: Joi.string().optional().trim(),
    categoryId: Joi.string().optional().pattern(/^[0-9a-fA-F]{24}$/),
    status: Joi.string().valid('pending', 'received', 'distributed', 'expired').optional(),
    dateFrom: Joi.date().optional(),
    dateTo: Joi.date().optional()
  })),
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const { page, limit, search, categoryId, status, dateFrom, dateTo } = req.query as any;
      
      const result = await DonationService.listWithPagination({
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
        search,
        categoryId,
        status,
        dateFrom: dateFrom ? new Date(dateFrom) : undefined,
        dateTo: dateTo ? new Date(dateTo) : undefined
      });

      res.status(200).json({
        message: "Doações listadas com sucesso",
        data: result
      });
    } catch (error) {
      res.status(500).json({
        message: "Erro interno do servidor ao listar doações",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  }),
];
