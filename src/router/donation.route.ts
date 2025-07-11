import express from "express";
import {
  getDonations,
  getDonationById,
  getDonationsByCategory,
  getDonationsByStatus,
  getDonationStats,
  getDonationStatsByCategory,
  createDonation,
  updateDonation,
  updateDonationStatus,
  deleteDonation,
} from "../controllers/donation.controller.js";

export default (router: express.Router) => {
  // Listar todas as doações (com paginação e filtros)
  router.get("/donations", getDonations);
  
  // Estatísticas de doações
  router.get("/donations/stats", getDonationStats);
  
  // Estatísticas por categoria
  router.get("/donations/stats/by-category", getDonationStatsByCategory);
  
  // Buscar doações por categoria
  router.get("/donations/category/:categoryId", getDonationsByCategory);
  
  // Buscar doações por status
  router.get("/donations/status/:status", getDonationsByStatus);
  
  // Buscar doação por ID
  router.get("/donations/:id", getDonationById);
  
  // Criar nova doação
  router.post("/donations", createDonation);
  
  // Atualizar doação
  router.put("/donations/:id", updateDonation);
  
  // Atualizar apenas o status da doação
  router.patch("/donations/:id/status", updateDonationStatus);
  
  // Deletar doação
  router.delete("/donations/:id", deleteDonation);
};
