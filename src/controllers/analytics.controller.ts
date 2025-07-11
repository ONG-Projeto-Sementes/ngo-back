import express from "express";
import Joi from "joi";
import { AsyncHandler } from "../middlewares/AsyncHandler.js";
import { QueryHandler } from "../middlewares/QueryHandler.js";
import AnalyticsService from "../services/analytics.service.js";

// Schema de validação para filtros de período
const periodSchema = Joi.object({
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  period: Joi.string().valid('today', 'week', 'month', 'quarter', 'year', 'all').optional(),
  categoryId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional()
});

// Schema para análise de tendências
const trendSchema = Joi.object({
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  groupBy: Joi.string().valid('day', 'week', 'month', 'quarter', 'year').optional(),
  categoryId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional()
});

// ===== DASHBOARD OVERVIEW =====
export const getDashboardOverview = [
  QueryHandler(periodSchema),
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const filters = req.query as any;
      const overview = await AnalyticsService.getDashboardOverview(filters);
      
      res.status(200).json({
        success: true,
        message: "Overview do dashboard obtido com sucesso",
        data: overview
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor ao obter overview",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  })
];

// ===== ANÁLISE DE TENDÊNCIAS =====
export const getTrendAnalysis = [
  QueryHandler(trendSchema),
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const filters = req.query as any;
      const trends = await AnalyticsService.getTrendAnalysis(filters);
      
      res.status(200).json({
        success: true,
        message: "Análise de tendências obtida com sucesso",
        data: trends
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor ao obter análise de tendências",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  })
];

// ===== PERFORMANCE DE CATEGORIAS =====
export const getCategoryPerformance = [
  QueryHandler(periodSchema),
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const filters = req.query as any;
      const performance = await AnalyticsService.getCategoryPerformance(filters);
      
      res.status(200).json({
        success: true,
        message: "Performance de categorias obtida com sucesso",
        data: performance
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor ao obter performance de categorias",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  })
];

// ===== ANALYTICS DE DOADORES =====
export const getDonorAnalytics = [
  QueryHandler(periodSchema),
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const filters = req.query as any;
      const analytics = await AnalyticsService.getDonorAnalytics(filters);
      
      res.status(200).json({
        success: true,
        message: "Analytics de doadores obtida com sucesso",
        data: analytics
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor ao obter analytics de doadores",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  })
];

// ===== MÉTRICAS DE EFICIÊNCIA =====
export const getEfficiencyMetrics = [
  QueryHandler(periodSchema),
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const filters = req.query as any;
      const metrics = await AnalyticsService.getEfficiencyMetrics(filters);
      
      res.status(200).json({
        success: true,
        message: "Métricas de eficiência obtidas com sucesso",
        data: metrics
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor ao obter métricas de eficiência",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  })
];

// ===== RESUMO EXECUTIVO =====
export const getExecutiveSummary = [
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const [overview, trends, efficiency] = await Promise.all([
        AnalyticsService.getDashboardOverview({ period: 'month' }),
        AnalyticsService.getTrendAnalysis({ groupBy: 'month' }),
        AnalyticsService.getEfficiencyMetrics({})
      ]);
      
      const summary = {
        period: 'last_month',
        keyMetrics: {
          totalDonations: overview.overview.totalDonations,
          totalValue: overview.overview.totalValue,
          distributionRate: overview.overview.distributionPercentage,
          familiesBenefited: overview.overview.totalFamiliesBenefited,
          avgDistributionTime: efficiency.timing.averageDaysToDistribution
        },
        alerts: efficiency.alerts,
        topPerformers: {
          topDonor: overview.recent.topDonations[0] || null,
          topCategory: overview.breakdown.byCategory[0] || null
        },
        trends: {
          donations: trends.donations.slice(-3),
          distributions: trends.distributions.slice(-3)
        },
        generatedAt: new Date()
      };
      
      res.status(200).json({
        success: true,
        message: "Resumo executivo obtido com sucesso",
        data: summary
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor ao obter resumo executivo",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  })
];

// ===== ALERTAS DO SISTEMA =====
export const getSystemAlerts = [
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const efficiency = await AnalyticsService.getEfficiencyMetrics();
      
      const alerts = {
        critical: [] as any[],
        warning: [] as any[],
        info: [] as any[],
        summary: {
          total: 0,
          critical: 0,
          warning: 0,
          info: 0
        }
      };
      
      // Alertas críticos - estoque muito baixo
      efficiency.alerts.lowStock.forEach((item: any) => {
        if (item.inStock <= 3) {
          alerts.critical.push({
            type: 'low_stock_critical',
            message: `Estoque crítico: ${item.donorName} - ${item.categoryName}`,
            details: `Apenas ${item.inStock} ${item.unit} restantes`,
            priority: 'high',
            data: item
          });
        }
      });
      
      // Alertas de aviso - estoque baixo
      efficiency.alerts.lowStock.forEach((item: any) => {
        if (item.inStock > 3 && item.inStock <= 10) {
          alerts.warning.push({
            type: 'low_stock_warning',
            message: `Estoque baixo: ${item.donorName} - ${item.categoryName}`,
            details: `${item.inStock} ${item.unit} restantes`,
            priority: 'medium',
            data: item
          });
        }
      });
      
      // Alertas informativos - distribuições pendentes
      if (efficiency.alerts.pendingDistributions > 0) {
        alerts.info.push({
          type: 'pending_distributions',
          message: `Distribuições pendentes`,
          details: `${efficiency.alerts.pendingDistributions} distribuições aguardando confirmação`,
          priority: 'low',
          count: efficiency.alerts.pendingDistributions
        });
      }
      
      // Alertas informativos - tempo médio de distribuição alto
      if (efficiency.timing.averageDaysToDistribution > 7) {
        alerts.warning.push({
          type: 'slow_distribution',
          message: `Tempo de distribuição elevado`,
          details: `Média de ${efficiency.timing.averageDaysToDistribution} dias para distribuição`,
          priority: 'medium',
          avgDays: efficiency.timing.averageDaysToDistribution
        });
      }
      
      // Calcular resumo
      alerts.summary.critical = alerts.critical.length;
      alerts.summary.warning = alerts.warning.length;
      alerts.summary.info = alerts.info.length;
      alerts.summary.total = alerts.summary.critical + alerts.summary.warning + alerts.summary.info;
      
      res.status(200).json({
        success: true,
        message: "Alertas do sistema obtidos com sucesso",
        data: {
          ...alerts,
          generatedAt: new Date()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor ao obter alertas",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  })
];

// ===== MÉTRICAS DE WIDGETS =====
export const getWidgetMetrics = [
  QueryHandler(Joi.object({
    widgets: Joi.array().items(
      Joi.string().valid(
        'total_donations', 'total_value', 'stock_status', 'recent_activity',
        'top_categories', 'distribution_rate', 'family_impact', 'donor_stats'
      )
    ).required()
  })),
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const { widgets } = req.query as any;
      const results: any = {};
      
      // Obter dados base se necessário
      const [overview, efficiency] = await Promise.all([
        AnalyticsService.getDashboardOverview({ period: 'all' }),
        AnalyticsService.getEfficiencyMetrics()
      ]);
      
      // Gerar métricas específicas para cada widget solicitado
      for (const widget of widgets) {
        switch (widget) {
          case 'total_donations':
            results[widget] = {
              value: overview.overview.totalDonations,
              label: 'Total de Doações',
              icon: 'gift',
              trend: '+5%'
            };
            break;
            
          case 'total_value':
            results[widget] = {
              value: overview.overview.totalValue,
              label: 'Valor Total',
              icon: 'dollar-sign',
              formatted: `R$ ${overview.overview.totalValue.toLocaleString('pt-BR')}`
            };
            break;
            
          case 'stock_status':
            results[widget] = {
              inStock: overview.overview.inStock,
              stockValue: overview.overview.stockValue,
              percentage: overview.overview.stockPercentage,
              label: 'Em Estoque',
              icon: 'package'
            };
            break;
            
          case 'recent_activity':
            results[widget] = {
              recentDonations: overview.recent.donations.slice(0, 5),
              label: 'Atividade Recente',
              icon: 'activity'
            };
            break;
            
          case 'top_categories':
            results[widget] = {
              categories: overview.breakdown.byCategory.slice(0, 5),
              label: 'Top Categorias',
              icon: 'pie-chart'
            };
            break;
            
          case 'distribution_rate':
            results[widget] = {
              percentage: overview.overview.distributionPercentage,
              distributed: overview.overview.totalDistributed,
              total: overview.overview.totalQuantity,
              label: 'Taxa de Distribuição',
              icon: 'trending-up'
            };
            break;
            
          case 'family_impact':
            results[widget] = {
              totalFamilies: overview.overview.totalFamiliesBenefited,
              averagePerFamily: overview.overview.averagePerFamily,
              label: 'Impacto nas Famílias',
              icon: 'users'
            };
            break;
            
          case 'donor_stats':
            const donorAnalytics = await AnalyticsService.getDonorAnalytics();
            results[widget] = {
              totalDonors: donorAnalytics.summary.totalUniqueDonors,
              avgDonationsPerDonor: donorAnalytics.summary.avgDonationsPerDonor,
              topDonor: donorAnalytics.summary.topDonor,
              label: 'Estatísticas de Doadores',
              icon: 'heart'
            };
            break;
        }
      }
      
      res.status(200).json({
        success: true,
        message: "Métricas de widgets obtidas com sucesso",
        data: {
          widgets: results,
          generatedAt: new Date()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor ao obter métricas de widgets",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  })
];
