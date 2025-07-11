import express from "express";
import {
  getDashboardOverview,
  getTrendAnalysis,
  getCategoryPerformance,
  getDonorAnalytics,
  getEfficiencyMetrics,
} from "../controllers/analytics.controller.js";

export default (router: express.Router) => {
  // Dashboard overview - dados principais para a página inicial
  router.get("/analytics/dashboard", getDashboardOverview);
  
  // Análise de tendências - gráficos de linha temporal
  router.get("/analytics/trends", getTrendAnalysis);
  
  // Performance de categorias - análise detalhada por categoria
  router.get("/analytics/categories", getCategoryPerformance);
  
  // Analytics de doadores - segmentação e análise de comportamento
  router.get("/analytics/donors", getDonorAnalytics);
  
  // Métricas de eficiência - KPIs operacionais
  router.get("/analytics/efficiency", getEfficiencyMetrics);
};
