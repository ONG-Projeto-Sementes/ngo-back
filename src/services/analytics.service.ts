import mongoose from "mongoose";
import { DonationModel } from "../models/donation.js";
import { DonationDistributionModel } from "../models/donation-distribution.js";
import { FamilyModel } from "../models/family.js";
import { DonationCategoryModel } from "../models/donation-category.js";

export class AnalyticsService {
  
  // ===== OVERVIEW DASHBOARD =====
  
  /**
   * Retorna um overview completo das principais métricas do sistema
   */
  async getDashboardOverview(filters: {
    startDate?: Date;
    endDate?: Date;
    period?: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all';
    categoryId?: string;
  } = {}) {
    const dateFilter = this.buildDateFilter(filters);
    const categoryFilter = filters.categoryId ? { categoryId: new mongoose.Types.ObjectId(filters.categoryId) } : {};
    
    const donationFilters = { 
      deleted: false, 
      ...dateFilter, 
      ...categoryFilter 
    };

    // Executar consultas em paralelo para melhor performance
    const [
      totalStats,
      distributionStats,
      familyStats,
      recentDonations,
      topDonations,
      statusBreakdown,
      categoryBreakdown,
      growthPercentages
    ] = await Promise.all([
      this.getTotalDonationStats(donationFilters),
      this.getDistributionStats(filters),
      this.getFamilyStats(),
      this.getRecentDonations(5),
      this.getTopDonations(3),
      this.getDonationStatusBreakdown(donationFilters),
      this.getCategoryBreakdown(donationFilters),
      this.getGrowthPercentages(filters)
    ]);

    return {
      overview: {
        totalDonations: totalStats.totalDonations,
        totalValue: totalStats.totalValue,
        totalQuantity: totalStats.totalQuantity,
        averageDonationValue: totalStats.averageDonationValue,
        
        // Estatísticas de distribuição
        totalDistributed: distributionStats.totalDistributed,
        totalDistributedValue: distributionStats.totalDistributedValue,
        inStock: totalStats.totalQuantity - distributionStats.totalDistributed,
        stockValue: totalStats.totalValue - distributionStats.totalDistributedValue,
        
        // Estatísticas de famílias
        totalFamiliesBenefited: familyStats.totalFamiliesBenefited,
        averagePerFamily: familyStats.averagePerFamily,
        
        // Percentuais
        distributionPercentage: totalStats.totalQuantity > 0 
          ? Math.round((distributionStats.totalDistributed / totalStats.totalQuantity) * 100) 
          : 0,
        stockPercentage: totalStats.totalQuantity > 0 
          ? Math.round(((totalStats.totalQuantity - distributionStats.totalDistributed) / totalStats.totalQuantity) * 100) 
          : 0,
        
        // Percentuais de crescimento
        totalDonors: totalStats.totalDonors || 0,
        donationsGrowth: growthPercentages.donationsGrowth,
        valueGrowth: growthPercentages.valueGrowth,
        donorsGrowth: growthPercentages.donorsGrowth
      },
      
      recent: {
        donations: recentDonations,
        topDonations: topDonations
      },
      
      breakdown: {
        byStatus: statusBreakdown,
        byCategory: categoryBreakdown
      },
      
      period: filters.period || 'all',
      generatedAt: new Date()
    };
  }

  // ===== ANÁLISE DE TENDÊNCIAS =====
  
  /**
   * Retorna análise de tendências temporais das doações
   */
  async getTrendAnalysis(filters: {
    startDate?: Date;
    endDate?: Date;
    groupBy?: 'day' | 'week' | 'month' | 'quarter' | 'year';
    categoryId?: string;
  } = {}) {
    const groupBy = filters.groupBy || 'month';
    const dateFilter = this.buildDateFilter(filters);
    const categoryFilter = filters.categoryId ? { categoryId: new mongoose.Types.ObjectId(filters.categoryId) } : {};
    
    const matchStage = { 
      deleted: false, 
      ...dateFilter, 
      ...categoryFilter 
    };

    // Definir formato de agrupamento baseado no período
    const groupFormat = this.getGroupFormat(groupBy);
    
    // Pipeline para tendências de doações
    const donationTrends = await DonationModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: groupFormat,
          totalDonations: { $sum: 1 },
          totalValue: { $sum: "$estimatedValue" },
          totalQuantity: { $sum: "$quantity" },
          avgValue: { $avg: "$estimatedValue" },
          avgQuantity: { $avg: "$quantity" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Pipeline para tendências de distribuição
    const distributionTrends = await DonationDistributionModel.aggregate([
      {
        $lookup: {
          from: 'donations',
          localField: 'donationId',
          foreignField: '_id',
          as: 'donation'
        }
      },
      { $unwind: '$donation' },
      { 
        $match: { 
          deleted: false, 
          status: { $ne: 'cancelled' },
          ...this.buildDateFilter(filters, 'distributionDate'),
          ...(filters.categoryId ? { 'donation.categoryId': new mongoose.Types.ObjectId(filters.categoryId) } : {})
        }
      },
      {
        $group: {
          _id: this.getGroupFormat(groupBy, 'distributionDate'),
          totalDistributions: { $sum: 1 },
          totalQuantityDistributed: { $sum: "$quantity" },
          uniqueFamilies: { $addToSet: "$familyId" }
        }
      },
      {
        $addFields: {
          familiesCount: { $size: "$uniqueFamilies" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    return {
      donations: donationTrends,
      distributions: distributionTrends,
      period: groupBy,
      generatedAt: new Date()
    };
  }

  // ===== PERFORMANCE POR CATEGORIA =====
  
  /**
   * Retorna análise detalhada de performance por categoria
   */
  async getCategoryPerformance(filters: {
    startDate?: Date;
    endDate?: Date;
  } = {}) {
    const dateFilter = this.buildDateFilter(filters);
    
    const categoryPerformance = await DonationModel.aggregate([
      { $match: { deleted: false, ...dateFilter } },
      {
        $lookup: {
          from: 'donationcategories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $lookup: {
          from: 'donationdistributions',
          localField: '_id',
          foreignField: 'donationId',
          as: 'distributions'
        }
      },
      {
        $addFields: {
          totalDistributed: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$distributions',
                    cond: { 
                      $and: [
                        { $eq: ['$$this.deleted', false] },
                        { $ne: ['$$this.status', 'cancelled'] }
                      ]
                    }
                  }
                },
                as: 'dist',
                in: '$$dist.quantity'
              }
            }
          },
          uniqueFamilies: {
            $size: {
              $setUnion: {
                $map: {
                  input: {
                    $filter: {
                      input: '$distributions',
                      cond: { 
                        $and: [
                          { $eq: ['$$this.deleted', false] },
                          { $ne: ['$$this.status', 'cancelled'] }
                        ]
                      }
                    }
                  },
                  as: 'dist',
                  in: '$$dist.familyId'
                }
              }
            }
          }
        }
      },
      {
        $group: {
          _id: '$category._id',
          categoryName: { $first: '$category.name' },
          categoryIcon: { $first: '$category.icon' },
          categoryColor: { $first: '$category.color' },
          defaultUnit: { $first: '$category.defaultUnit' },
          
          // Estatísticas de doações
          totalDonations: { $sum: 1 },
          totalValue: { $sum: '$estimatedValue' },
          totalQuantity: { $sum: '$quantity' },
          avgDonationValue: { $avg: '$estimatedValue' },
          avgDonationQuantity: { $avg: '$quantity' },
          
          // Estatísticas de distribuição
          totalDistributed: { $sum: '$totalDistributed' },
          totalFamiliesBenefited: { $sum: '$uniqueFamilies' },
          
          // Valores mínimos e máximos
          minDonationValue: { $min: '$estimatedValue' },
          maxDonationValue: { $max: '$estimatedValue' },
          minDonationQuantity: { $min: '$quantity' },
          maxDonationQuantity: { $max: '$quantity' }
        }
      },
      {
        $addFields: {
          inStock: { $subtract: ['$totalQuantity', '$totalDistributed'] },
          distributionRate: {
            $cond: [
              { $gt: ['$totalQuantity', 0] },
              { $multiply: [{ $divide: ['$totalDistributed', '$totalQuantity'] }, 100] },
              0
            ]
          },
          efficiency: {
            $cond: [
              { $gt: ['$totalDonations', 0] },
              { $divide: ['$totalFamiliesBenefited', '$totalDonations'] },
              0
            ]
          }
        }
      },
      { $sort: { totalValue: -1 } }
    ]);

    return {
      categories: categoryPerformance,
      summary: {
        totalCategories: categoryPerformance.length,
        totalCategoriesWithDonations: categoryPerformance.filter(c => c.totalDonations > 0).length,
        mostValuableCategory: categoryPerformance[0]?.categoryName || 'N/A',
        mostEfficientCategory: categoryPerformance.reduce((prev, current) => 
          (current.efficiency > prev.efficiency) ? current : prev, categoryPerformance[0] || {})?.categoryName || 'N/A'
      },
      generatedAt: new Date()
    };
  }

  // ===== ANALYTICS DE DOADORES =====
  
  /**
   * Retorna análise de doadores e padrões de doação
   */
  async getDonorAnalytics(filters: {
    startDate?: Date;
    endDate?: Date;
  } = {}) {
    const dateFilter = this.buildDateFilter(filters);
    
    const donorStats = await DonationModel.aggregate([
      { $match: { deleted: false, ...dateFilter } },
      {
        $group: {
          _id: '$donorName',
          donorContact: { $first: '$donorContact' },
          totalDonations: { $sum: 1 },
          totalValue: { $sum: '$estimatedValue' },
          totalQuantity: { $sum: '$quantity' },
          avgValue: { $avg: '$estimatedValue' },
          avgQuantity: { $avg: '$quantity' },
          firstDonation: { $min: '$receivedDate' },
          lastDonation: { $max: '$receivedDate' },
          categories: { $addToSet: '$categoryId' }
        }
      },
      {
        $addFields: {
          categoriesCount: { $size: '$categories' },
          donorType: {
            $cond: [
              { $gte: ['$totalDonations', 5] },
              'frequent',
              { $cond: [{ $gte: ['$totalDonations', 2] }, 'regular', 'occasional'] }
            ]
          },
          daysSinceFirst: {
            $divide: [
              { $subtract: [new Date(), '$firstDonation'] },
              1000 * 60 * 60 * 24
            ]
          }
        }
      },
      { $sort: { totalValue: -1 } }
    ]);

    // Análise de retenção de doadores
    const retentionAnalysis = await this.getDonorRetentionAnalysis(dateFilter);
    
    // Segmentação de doadores
    const segmentation = {
      frequent: donorStats.filter(d => d.donorType === 'frequent').length,
      regular: donorStats.filter(d => d.donorType === 'regular').length,
      occasional: donorStats.filter(d => d.donorType === 'occasional').length
    };

    return {
      donors: donorStats.slice(0, 50), // Top 50 doadores
      summary: {
        totalUniqueDonors: donorStats.length,
        avgDonationsPerDonor: donorStats.length > 0 
          ? Math.round(donorStats.reduce((sum, d) => sum + d.totalDonations, 0) / donorStats.length) 
          : 0,
        avgValuePerDonor: donorStats.length > 0 
          ? donorStats.reduce((sum, d) => sum + d.totalValue, 0) / donorStats.length 
          : 0,
        topDonor: donorStats[0] || null,
        segmentation
      },
      retention: retentionAnalysis,
      generatedAt: new Date()
    };
  }

  // ===== MÉTRICAS DE EFICIÊNCIA =====
  
  /**
   * Retorna métricas operacionais e KPIs de eficiência
   */
  async getEfficiencyMetrics(filters: {
    startDate?: Date;
    endDate?: Date;
  } = {}) {
    const dateFilter = this.buildDateFilter(filters);
    
    // Tempo médio para distribuição
    const distributionTimingStats = await DonationDistributionModel.aggregate([
      { $match: { deleted: false, status: { $ne: 'cancelled' } } },
      {
        $lookup: {
          from: 'donations',
          localField: 'donationId',
          foreignField: '_id',
          as: 'donation'
        }
      },
      { $unwind: '$donation' },
      { $match: { 'donation.deleted': false, ...this.buildDateFilter(filters, 'donation.receivedDate') } },
      {
        $addFields: {
          daysToDistribution: {
            $divide: [
              { $subtract: ['$distributionDate', '$donation.receivedDate'] },
              1000 * 60 * 60 * 24
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgDaysToDistribution: { $avg: '$daysToDistribution' },
          minDaysToDistribution: { $min: '$daysToDistribution' },
          maxDaysToDistribution: { $max: '$daysToDistribution' },
          totalDistributions: { $sum: 1 }
        }
      }
    ]);

    // Taxa de distribuição por status
    const statusEfficiency = await DonationModel.aggregate([
      { $match: { deleted: false, ...dateFilter } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$estimatedValue' },
          totalQuantity: { $sum: '$quantity' }
        }
      }
    ]);

    // Eficiência por categoria
    const categoryEfficiency = await this.getCategoryEfficiency(dateFilter);
    
    // Alertas de estoque baixo
    const lowStockAlerts = await this.getLowStockAlerts();

    const timingStats = distributionTimingStats[0] || {
      avgDaysToDistribution: 0,
      minDaysToDistribution: 0,
      maxDaysToDistribution: 0,
      totalDistributions: 0
    };

    return {
      timing: {
        averageDaysToDistribution: Math.round(timingStats.avgDaysToDistribution || 0),
        fastestDistribution: Math.round(timingStats.minDaysToDistribution || 0),
        slowestDistribution: Math.round(timingStats.maxDaysToDistribution || 0),
        totalDistributionsAnalyzed: timingStats.totalDistributions
      },
      
      status: statusEfficiency.map(s => ({
        status: s._id,
        count: s.count,
        percentage: 0, // Será calculado no frontend
        totalValue: s.totalValue,
        totalQuantity: s.totalQuantity
      })),
      
      categories: categoryEfficiency,
      
      alerts: {
        lowStock: lowStockAlerts,
        expiringSoon: [], // Implementar se houver data de validade
        pendingDistributions: await this.getPendingDistributionsCount()
      },
      
      generatedAt: new Date()
    };
  }

  // ===== MÉTODOS AUXILIARES =====

  /**
   * Constrói filtro de data baseado nos parâmetros
   */
  private buildDateFilter(filters: any, dateField: string = 'receivedDate'): any {
    let dateFilter: any = {};
    
    if (filters.startDate && filters.endDate) {
      dateFilter[dateField] = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate)
      };
    } else if (filters.period) {
      const now = new Date();
      
      switch (filters.period) {
        case 'today':
          dateFilter[dateField] = {
            $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
          };
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateFilter[dateField] = { $gte: weekAgo, $lte: now };
          break;
        case 'month':
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          dateFilter[dateField] = { $gte: monthAgo, $lte: now };
          break;
        case 'quarter':
          const quarterAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
          dateFilter[dateField] = { $gte: quarterAgo, $lte: now };
          break;
        case 'year':
          const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          dateFilter[dateField] = { $gte: yearAgo, $lte: now };
          break;
      }
    }
    
    return dateFilter;
  }

  /**
   * Retorna formato de agrupamento para agregações temporais
   */
  private getGroupFormat(groupBy: string, dateField: string = '$receivedDate'): any {
    const fieldExpression = typeof dateField === 'string' && dateField.startsWith('$') 
      ? dateField 
      : `$${dateField}`;
    
    switch (groupBy) {
      case 'day':
        return {
          year: { $year: fieldExpression },
          month: { $month: fieldExpression },
          day: { $dayOfMonth: fieldExpression }
        };
      case 'week':
        return {
          year: { $year: fieldExpression },
          week: { $week: fieldExpression }
        };
      case 'month':
        return {
          year: { $year: fieldExpression },
          month: { $month: fieldExpression }
        };
      case 'quarter':
        return {
          year: { $year: fieldExpression },
          quarter: {
            $ceil: { $divide: [{ $month: fieldExpression }, 3] }
          }
        };
      case 'year':
        return { year: { $year: fieldExpression } };
      default:
        return {
          year: { $year: fieldExpression },
          month: { $month: fieldExpression }
        };
    }
  }

  /**
   * Calcula estatísticas totais de doações
   */
  private async getTotalDonationStats(filters: any) {
    const stats = await DonationModel.aggregate([
      { $match: filters },
      {
        $group: {
          _id: null,
          totalDonations: { $sum: 1 },
          totalValue: { $sum: '$estimatedValue' },
          totalQuantity: { $sum: '$quantity' },
          avgValue: { $avg: '$estimatedValue' },
          totalDonors: { $addToSet: '$donorName' }
        }
      },
      {
        $project: {
          totalDonations: 1,
          totalValue: 1,
          totalQuantity: 1,
          avgValue: 1,
          totalDonors: { $size: '$totalDonors' }
        }
      }
    ]);

    const result = stats[0] || {
      totalDonations: 0,
      totalValue: 0,
      totalQuantity: 0,
      avgValue: 0,
      totalDonors: 0
    };

    return {
      ...result,
      averageDonationValue: Math.round(result.avgValue || 0)
    };
  }

  /**
   * Calcula estatísticas de distribuição
   */
  private async getDistributionStats(filters: any) {
    const distributionFilters: any = { 
      deleted: false, 
      status: { $ne: 'cancelled' } 
    };

    if (filters.startDate || filters.endDate || filters.period) {
      Object.assign(distributionFilters, this.buildDateFilter(filters, 'distributionDate'));
    }

    const stats = await DonationDistributionModel.aggregate([
      { $match: distributionFilters },
      {
        $lookup: {
          from: 'donations',
          localField: 'donationId',
          foreignField: '_id',
          as: 'donation'
        }
      },
      { $unwind: '$donation' },
      {
        $group: {
          _id: null,
          totalDistributed: { $sum: '$quantity' },
          totalDistributedValue: { 
            $sum: { 
              $multiply: [
                '$quantity', 
                { $divide: ['$donation.estimatedValue', '$donation.quantity'] }
              ] 
            }
          }
        }
      }
    ]);

    return stats[0] || {
      totalDistributed: 0,
      totalDistributedValue: 0
    };
  }

  /**
   * Calcula estatísticas de famílias beneficiadas
   */
  private async getFamilyStats() {
    const stats = await DonationDistributionModel.aggregate([
      { $match: { deleted: false, status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: '$familyId',
          totalReceived: { $sum: '$quantity' },
          distributionsCount: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: null,
          totalFamiliesBenefited: { $sum: 1 },
          avgPerFamily: { $avg: '$totalReceived' }
        }
      }
    ]);

    return stats[0] || {
      totalFamiliesBenefited: 0,
      avgPerFamily: 0
    };
  }

  /**
   * Busca doações recentes
   */
  private async getRecentDonations(limit: number = 5) {
    return await DonationModel.find({ deleted: false })
      .populate('categoryId', 'name icon color')
      .sort({ receivedDate: -1 })
      .limit(limit)
      .select('donorName quantity unit estimatedValue receivedDate status categoryId')
      .lean();
  }

  /**
   * Busca maiores doações
   */
  private async getTopDonations(limit: number = 3) {
    return await DonationModel.find({ deleted: false })
      .populate('categoryId', 'name icon color')
      .sort({ estimatedValue: -1 })
      .limit(limit)
      .select('donorName quantity unit estimatedValue receivedDate status categoryId')
      .lean();
  }

  /**
   * Breakdown por status
   */
  private async getDonationStatusBreakdown(filters: any) {
    return await DonationModel.aggregate([
      { $match: filters },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$estimatedValue' },
          totalQuantity: { $sum: '$quantity' }
        }
      },
      { $sort: { count: -1 } }
    ]);
  }

  /**
   * Breakdown por categoria
   */
  private async getCategoryBreakdown(filters: any) {
    return await DonationModel.aggregate([
      { $match: filters },
      {
        $lookup: {
          from: 'donationcategories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $group: {
          _id: '$categoryId',
          categoryName: { $first: '$category.name' },
          categoryIcon: { $first: '$category.icon' },
          categoryColor: { $first: '$category.color' },
          count: { $sum: 1 },
          totalValue: { $sum: '$estimatedValue' },
          totalQuantity: { $sum: '$quantity' }
        }
      },
      { $sort: { totalValue: -1 } }
    ]);
  }

  /**
   * Análise de retenção de doadores
   */
  private async getDonorRetentionAnalysis(dateFilter: any) {
    // Implementação simplificada - pode ser expandida
    const retentionStats = await DonationModel.aggregate([
      { $match: { deleted: false, ...dateFilter } },
      {
        $group: {
          _id: '$donorName',
          donationCount: { $sum: 1 },
          firstDonation: { $min: '$receivedDate' },
          lastDonation: { $max: '$receivedDate' }
        }
      },
      {
        $addFields: {
          isReturnDonor: { $gt: ['$donationCount', 1] }
        }
      },
      {
        $group: {
          _id: null,
          totalDonors: { $sum: 1 },
          returnDonors: { $sum: { $cond: ['$isReturnDonor', 1, 0] } }
        }
      }
    ]);

    const stats = retentionStats[0] || { totalDonors: 0, returnDonors: 0 };
    
    return {
      totalDonors: stats.totalDonors,
      returnDonors: stats.returnDonors,
      retentionRate: stats.totalDonors > 0 
        ? Math.round((stats.returnDonors / stats.totalDonors) * 100) 
        : 0
    };
  }

  /**
   * Eficiência por categoria
   */
  private async getCategoryEfficiency(dateFilter: any) {
    return await DonationModel.aggregate([
      { $match: { deleted: false, ...dateFilter } },
      {
        $lookup: {
          from: 'donationcategories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $lookup: {
          from: 'donationdistributions',
          localField: '_id',
          foreignField: 'donationId',
          as: 'distributions'
        }
      },
      {
        $addFields: {
          distributedQuantity: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$distributions',
                    cond: { 
                      $and: [
                        { $eq: ['$$this.deleted', false] },
                        { $ne: ['$$this.status', 'cancelled'] }
                      ]
                    }
                  }
                },
                as: 'dist',
                in: '$$dist.quantity'
              }
            }
          }
        }
      },
      {
        $group: {
          _id: '$categoryId',
          categoryName: { $first: '$category.name' },
          totalQuantity: { $sum: '$quantity' },
          totalDistributed: { $sum: '$distributedQuantity' },
          totalDonations: { $sum: 1 }
        }
      },
      {
        $addFields: {
          distributionRate: {
            $cond: [
              { $gt: ['$totalQuantity', 0] },
              { $multiply: [{ $divide: ['$totalDistributed', '$totalQuantity'] }, 100] },
              0
            ]
          },
          inStock: { $subtract: ['$totalQuantity', '$totalDistributed'] }
        }
      },
      { $sort: { distributionRate: -1 } }
    ]);
  }

  /**
   * Alertas de estoque baixo
   */
  private async getLowStockAlerts(threshold: number = 10) {
    return await DonationModel.aggregate([
      { $match: { deleted: false, status: { $in: ['received', 'pending'] } } },
      {
        $lookup: {
          from: 'donationdistributions',
          localField: '_id',
          foreignField: 'donationId',
          as: 'distributions'
        }
      },
      {
        $addFields: {
          distributedQuantity: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$distributions',
                    cond: { 
                      $and: [
                        { $eq: ['$$this.deleted', false] },
                        { $ne: ['$$this.status', 'cancelled'] }
                      ]
                    }
                  }
                },
                as: 'dist',
                in: '$$dist.quantity'
              }
            }
          }
        }
      },
      {
        $addFields: {
          inStock: { $subtract: ['$quantity', '$distributedQuantity'] }
        }
      },
      { $match: { inStock: { $lte: threshold, $gt: 0 } } },
      {
        $lookup: {
          from: 'donationcategories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $project: {
          donorName: 1,
          quantity: 1,
          unit: 1,
          inStock: 1,
          categoryName: '$category.name',
          receivedDate: 1
        }
      },
      { $sort: { inStock: 1 } }
    ]);
  }

  /**
   * Conta distribuições pendentes
   */
  private async getPendingDistributionsCount() {
    return await DonationDistributionModel.countDocuments({
      deleted: false,
      status: 'pending'
    });
  }

  /**
   * Calcula percentuais de crescimento comparando período atual com anterior
   */
  private async getGrowthPercentages(filters: { period?: string } = {}) {
    const period = filters.period || 'month';
    
    // Definir datas para período atual e anterior
    const now = new Date();
    let currentStart: Date, currentEnd: Date, previousStart: Date, previousEnd: Date;
    
    if (period === 'month') {
      // Mês atual
      currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
      currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      // Mês anterior
      previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      previousEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (period === 'week') {
      // Semana atual (domingo a sábado)
      const currentWeekStart = new Date(now);
      currentWeekStart.setDate(now.getDate() - now.getDay());
      currentStart = new Date(currentWeekStart.getFullYear(), currentWeekStart.getMonth(), currentWeekStart.getDate());
      currentEnd = new Date(currentStart);
      currentEnd.setDate(currentEnd.getDate() + 6);
      
      // Semana anterior
      previousStart = new Date(currentStart);
      previousStart.setDate(previousStart.getDate() - 7);
      previousEnd = new Date(currentStart);
      previousEnd.setDate(previousEnd.getDate() - 1);
    } else {
      // Para outros períodos, usar mês como padrão
      currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
      currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      previousEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    }

    // Buscar dados do período atual
    const currentData = await this.getBasicStats({
      startDate: currentStart,
      endDate: currentEnd
    });

    // Buscar dados do período anterior
    const previousData = await this.getBasicStats({
      startDate: previousStart,
      endDate: previousEnd
    });

    // Calcular percentuais de crescimento
    const calculateGrowth = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    return {
      donationsGrowth: calculateGrowth(currentData.totalDonations, previousData.totalDonations),
      valueGrowth: calculateGrowth(currentData.totalValue, previousData.totalValue),
      donorsGrowth: calculateGrowth(currentData.totalDonors, previousData.totalDonors)
    };
  }

  /**
   * Obtém estatísticas básicas de doações
   */
  private async getBasicStats(filters: any) {
    const dateFilter: any = { deleted: false };
    
    if (filters.startDate && filters.endDate) {
      dateFilter.receivedDate = {
        $gte: filters.startDate,
        $lte: filters.endDate
      };
    }
    
    const stats = await DonationModel.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalDonations: { $sum: 1 },
          totalValue: { $sum: '$estimatedValue' },
          totalQuantity: { $sum: '$quantity' },
          totalDonors: { $addToSet: '$donorName' }
        }
      },
      {
        $project: {
          totalDonations: 1,
          totalValue: 1,
          totalQuantity: 1,
          totalDonors: { $size: '$totalDonors' }
        }
      }
    ]);

    return stats[0] || {
      totalDonations: 0,
      totalValue: 0,
      totalQuantity: 0,
      totalDonors: 0
    };
  }
}

export default new AnalyticsService();
