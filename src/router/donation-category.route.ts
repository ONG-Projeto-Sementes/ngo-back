import express from "express";
import {
  getDonationCategories,
  getActiveDonationCategories,
  getDonationCategoryById,
  createDonationCategory,
  updateDonationCategory,
  deactivateDonationCategory,
  activateDonationCategory,
  toggleDonationCategoryActivation,
  deleteDonationCategory,
} from "../controllers/donation-category.controller.js";

export default (router: express.Router) => {
  // Listar todas as categorias (com paginação e filtros)
  router.get("/donation-categories", getDonationCategories);
  
  // Listar apenas categorias ativas (para dropdowns/seletores)
  router.get("/donation-categories/active", getActiveDonationCategories);
  
  // Buscar categoria por ID
  router.get("/donation-categories/:id", getDonationCategoryById);
  
  // Criar nova categoria
  router.post("/donation-categories", createDonationCategory);
  
  // Atualizar categoria
  router.put("/donation-categories/:id", updateDonationCategory);
  
  // Toggle ativação/desativação (nova rota unificada)
  router.patch("/donation-categories/:id/activation", toggleDonationCategoryActivation);
  
  // Desativar categoria (soft delete) - mantido para compatibilidade
  router.patch("/donation-categories/:id/deactivate", deactivateDonationCategory);
  
  // Ativar categoria - mantido para compatibilidade
  router.patch("/donation-categories/:id/activate", activateDonationCategory);
  
  // Deletar categoria permanentemente (hard delete)
  router.delete("/donation-categories/:id", deleteDonationCategory);
};
