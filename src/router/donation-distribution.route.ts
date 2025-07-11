import express from "express";
import {
  getDistributions,
  getDistributionsByDonation,
  getDistributionsByFamily,
  getDistributionById,
  createDistribution,
  distributeToFamilies,
  updateDistribution,
  cancelDistribution,
  confirmDelivery,
  deleteDistribution,
  getDonationDistributionStats,
} from "../controllers/donation-distribution.controller.js";

export default (router: express.Router) => {
  // Listar todas as distribuições (com paginação e filtros)
  router.get("/distributions", getDistributions);
  
  // Buscar distribuições de uma doação específica
  router.get("/donations/:donationId/distributions", getDistributionsByDonation);
  
  // Buscar histórico de doações de uma família
  router.get("/families/:familyId/donations", getDistributionsByFamily);
  
  // Obter estatísticas de distribuição de uma doação
  router.get("/donations/:donationId/distributions/stats", getDonationDistributionStats);
  
  // Buscar distribuição por ID
  router.get("/distributions/:id", getDistributionById);
  
  // Criar nova distribuição
  router.post("/distributions", createDistribution);
  
  // Distribuir doação para múltiplas famílias
  router.post("/donations/:donationId/distribute", distributeToFamilies);
  
  // Atualizar distribuição
  router.put("/distributions/:id", updateDistribution);
  
  // Cancelar distribuição
  router.patch("/distributions/:id/cancel", cancelDistribution);
  
  // Confirmar entrega da distribuição
  router.patch("/distributions/:id/confirm", confirmDelivery);
  
  // Deletar distribuição
  router.delete("/distributions/:id", deleteDistribution);
};
