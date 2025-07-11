import Joi from "joi";
import express from "express";

import { BodyHandler } from "../middlewares/BodyHandler.js";
import { AsyncHandler } from "../middlewares/AsyncHandler.js";
import { QueryHandler } from "../middlewares/QueryHandler.js";
import DonationCategoryService from "../services/donation-category.service.js";

// Schema de validação para criação de categoria
const createCategorySchema = Joi.object({
  name: Joi.string().required().min(2).max(100).trim(),
  description: Joi.string().optional().max(500).trim(),
  defaultUnit: Joi.string().required().min(1).max(50).trim(),
  icon: Joi.string().optional().max(100),
  color: Joi.string().optional().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
  isActive: Joi.boolean().optional()
});

// Schema de validação para atualização de categoria
const updateCategorySchema = Joi.object({
  name: Joi.string().optional().min(2).max(100).trim(),
  description: Joi.string().optional().max(500).trim(),
  defaultUnit: Joi.string().optional().min(1).max(50).trim(),
  icon: Joi.string().optional().max(100),
  color: Joi.string().optional().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
  isActive: Joi.boolean().optional()
});

// Schema para query parameters
const querySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  search: Joi.string().optional().trim(),
  isActive: Joi.boolean().optional()
});

// Schema para toggle de ativação
const toggleActivationSchema = Joi.object({
  isActive: Joi.boolean().required()
});

export const getDonationCategories = [
  QueryHandler(querySchema),
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const { page = 1, limit = 10, search, isActive } = req.query as any;
      
      let filters: any = {};
      
      // Filtro por status ativo/inativo
      if (isActive !== undefined) {
        filters.isActive = isActive;
      }
      
      // Filtro de busca por nome
      if (search) {
        filters.name = { $regex: search, $options: 'i' };
      }

      if (page && limit) {
        const result = await DonationCategoryService.paginate({
          filters,
          page: Number(page),
          limit: Number(limit)
        });

        res.status(200).json({
          message: "Categorias listadas com sucesso",
          data: result
        });
      } else {
        const categories = await DonationCategoryService.list({ filters });
        res.status(200).json({
          message: "Categorias listadas com sucesso",
          data: categories
        });
      }
    } catch (error) {
      throw error;
    }
  }),
];

export const getActiveDonationCategories = [
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const categories = await DonationCategoryService.findActiveCategories();
      res.status(200).json({
        message: "Categorias ativas listadas com sucesso",
        data: categories
      });
    } catch (error) {
      throw error;
    }
  }),
];

export const getDonationCategoryById = [
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const category = await DonationCategoryService.findById(id);
      
      if (!category) {
        res.status(404).json({
          message: "Categoria não encontrada"
        });
        return;
      }

      res.status(200).json({
        message: "Categoria encontrada com sucesso",
        data: category
      });
    } catch (error) {
      throw error;
    }
  }),
];

export const createDonationCategory = [
  BodyHandler(createCategorySchema),
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const category = await DonationCategoryService.insert(req.body);
      res.status(201).json({
        message: "Categoria criada com sucesso",
        data: category
      });
    } catch (error) {
      throw error;
    }
  }),
];

export const updateDonationCategory = [
  BodyHandler(updateCategorySchema),
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const category = await DonationCategoryService.updateOne(id, req.body);
      res.status(200).json({
        message: "Categoria atualizada com sucesso",
        data: category
      });
    } catch (error) {
      throw error;
    }
  }),
];

export const deactivateDonationCategory = [
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const category = await DonationCategoryService.deactivateCategory(id);
      res.status(200).json({
        message: "Categoria desativada com sucesso",
        data: category
      });
    } catch (error) {
      throw error;
    }
  }),
];

export const activateDonationCategory = [
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const category = await DonationCategoryService.activateCategory(id);
      res.status(200).json({
        message: "Categoria ativada com sucesso",
        data: category
      });
    } catch (error) {
      throw error;
    }
  }),
];

export const deleteDonationCategory = [
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      await DonationCategoryService.deleteOne({ filters: { _id: id } });
      res.status(204).send();
    } catch (error) {
      throw error;
    }
  }),
];

export const toggleDonationCategoryActivation = [
  BodyHandler(Joi.object({
    isActive: Joi.boolean().required()
  })),
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      
      const category = await DonationCategoryService.updateOne(id, { isActive });
      
      res.status(200).json({
        message: `Categoria ${isActive ? 'ativada' : 'desativada'} com sucesso`,
        data: category
      });
    } catch (error) {
      throw error;
    }
  }),
];
