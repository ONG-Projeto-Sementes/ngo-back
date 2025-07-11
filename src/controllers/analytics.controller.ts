import express from "express";
import Joi from "joi";
import { AsyncHandler } from "../middlewares/AsyncHandler.js";
import { QueryHandler } from "../middlewares/QueryHandler.js";
import DonationService from "../services/donation.service.js";
import DonationCategoryService from "../services/donation-category.service.js";

// Schema de validação para filtros de período
const periodSchema = Joi.object({
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  period: Joi.string().valid('today', 'week', 'month', 'quarter', 'year', 'all').optional(),
  categoryId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional()
});

export const getDashboardOverview = [
  QueryHandler(periodSchema),
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const { startDate, endDate, period = 'all' } = req.query as any;
      
      // Calcular período baseado no parâmetro
      let dateFilter: any = {};
      const now = new Date();
      
      switch (period) {
        case 'today':
          dateFilter = {
            receivedDate: {
              $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
              $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
            }
          };
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateFilter = { receivedDate: { $gte: weekAgo, $lte: now } };
          break;
        case 'month':
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          dateFilter = { receivedDate: { $gte: monthAgo, $lte: now } };
          break;
        case 'quarter':
          const quarterAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
          dateFilter = { receivedDate: { $gte: quarterAgo, $lte: now } };
          break;
        case 'year':
          const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          dateFilter = { receivedDate: { $gte: yearAgo, $lte: now } };
          break;
        default:
          if (startDate && endDate) {
            dateFilter = {
              receivedDate: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
              }
            };
          }
      }

      // Estatísticas gerais
      const [
        totalStats,
        statusStats,
        categoryStats,
        donorStats,
        recentDonations
      ] = await Promise.all([
        // Total de doações e valores
        DonationService.aggregate([
          { $match: { deleted: false, ...dateFilter } },
          {
            $group: {
              _id: null,
              totalDonations: { $sum: 1 },
              totalValue: { $sum: { $ifNull: ['$estimatedValue', 0] } },
              totalQuantity: { $sum: '$quantity' },
              avgValue: { $avg: { $ifNull: ['$estimatedValue', 0] } },
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
        ]),
        
        // Estatísticas por status
        DonationService.aggregate([
          { $match: { deleted: false, ...dateFilter } },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
              totalValue: { $sum: { $ifNull: ['$estimatedValue', 0] } },
              totalQuantity: { $sum: '$quantity' }
            }
          }
        ]),
        
        // Estatísticas por categoria
        DonationService.aggregate([
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
            $group: {
              _id: '$categoryId',
              categoryName: { $first: '$category.name' },
              categoryIcon: { $first: '$category.icon' },
              categoryColor: { $first: '$category.color' },
              count: { $sum: 1 },
              totalValue: { $sum: { $ifNull: ['$estimatedValue', 0] } },
              totalQuantity: { $sum: '$quantity' }
            }
          },
          { $sort: { count: -1 } }
        ]),
        
        // Top doadores
        DonationService.aggregate([
          { $match: { deleted: false, ...dateFilter } },
          {
            $group: {
              _id: '$donorName',
              donorContact: { $first: '$donorContact' },
              totalDonations: { $sum: 1 },
              totalValue: { $sum: { $ifNull: ['$estimatedValue', 0] } },
              lastDonation: { $max: '$receivedDate' }
            }
          },
          { $sort: { totalDonations: -1 } },
          { $limit: 10 }
        ]),
        
        // Doações recentes
        DonationService.findWithCategory({
          ...dateFilter,
          $or: [
            { status: 'pending' },
            { status: 'received' }
          ]
        })
      ]);

      const overview = {
        period,
        dateRange: dateFilter.receivedDate ? {
          start: dateFilter.receivedDate.$gte,
          end: dateFilter.receivedDate.$lte || dateFilter.receivedDate.$lt
        } : null,
        summary: {
          totalDonations: totalStats[0]?.totalDonations || 0,
          totalValue: totalStats[0]?.totalValue || 0,
          totalQuantity: totalStats[0]?.totalQuantity || 0,
          avgDonationValue: totalStats[0]?.avgValue || 0,
          totalDonors: totalStats[0]?.totalDonors || 0
        },
        statusBreakdown: statusStats.map(stat => ({
          status: stat._id,
          count: stat.count,
          totalValue: stat.totalValue,
          totalQuantity: stat.totalQuantity,
          percentage: totalStats[0] ? (stat.count / totalStats[0].totalDonations * 100).toFixed(1) : 0
        })),
        categoryBreakdown: categoryStats.map(stat => ({
          categoryId: stat._id,
          categoryName: stat.categoryName,
          categoryIcon: stat.categoryIcon,
          categoryColor: stat.categoryColor,
          count: stat.count,
          totalValue: stat.totalValue,
          totalQuantity: stat.totalQuantity,
          percentage: totalStats[0] ? (stat.count / totalStats[0].totalDonations * 100).toFixed(1) : 0
        })),
        topDonors: donorStats.map(donor => ({
          name: donor._id,
          contact: donor.donorContact,
          totalDonations: donor.totalDonations,
          totalValue: donor.totalValue,
          lastDonation: donor.lastDonation
        })),
        recentActivity: recentDonations.slice(0, 5).map(donation => ({
          _id: donation._id,
          donorName: donation.donorName,
          category: donation.categoryId,
          quantity: donation.quantity,
          unit: donation.unit,
          estimatedValue: donation.estimatedValue,
          status: donation.status,
          receivedDate: donation.receivedDate
        }))
      };

      res.status(200).json({
        message: "Overview do dashboard obtido com sucesso",
        data: overview
      });
    } catch (error) {
      throw error;
    }
  }),
];

export const getTrendAnalysis = [
  QueryHandler(periodSchema),
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const { period = 'month' } = req.query as any;
      
      // Definir granularidade baseada no período
      let groupBy: any;
      let dateRange: any = {};
      const now = new Date();
      
      switch (period) {
        case 'week':
          groupBy = {
            year: { $year: '$receivedDate' },
            month: { $month: '$receivedDate' },
            day: { $dayOfMonth: '$receivedDate' }
          };
          dateRange = {
            receivedDate: {
              $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            }
          };
          break;
        case 'month':
          groupBy = {
            year: { $year: '$receivedDate' },
            month: { $month: '$receivedDate' },
            day: { $dayOfMonth: '$receivedDate' }
          };
          dateRange = {
            receivedDate: {
              $gte: new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
            }
          };
          break;
        case 'quarter':
          groupBy = {
            year: { $year: '$receivedDate' },
            week: { $week: '$receivedDate' }
          };
          dateRange = {
            receivedDate: {
              $gte: new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
            }
          };
          break;
        case 'year':
          groupBy = {
            year: { $year: '$receivedDate' },
            month: { $month: '$receivedDate' }
          };
          dateRange = {
            receivedDate: {
              $gte: new Date(now.getFullYear() - 1, 0, 1)
            }
          };
          break;
        default:
          groupBy = {
            year: { $year: '$receivedDate' },
            month: { $month: '$receivedDate' }
          };
      }

      const trendData = await DonationService.aggregate([
        { $match: { deleted: false, ...dateRange } },
        {
          $group: {
            _id: groupBy,
            donations: { $sum: 1 },
            totalValue: { $sum: { $ifNull: ['$estimatedValue', 0] } },
            avgValue: { $avg: { $ifNull: ['$estimatedValue', 0] } },
            uniqueDonors: { $addToSet: '$donorName' }
          }
        },
        {
          $project: {
            _id: 1,
            donations: 1,
            totalValue: 1,
            avgValue: 1,
            uniqueDonors: { $size: '$uniqueDonors' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } }
      ]);

      res.status(200).json({
        message: "Análise de tendências obtida com sucesso",
        data: {
          period,
          trends: trendData
        }
      });
    } catch (error) {
      throw error;
    }
  }),
];

export const getCategoryPerformance = [
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      // Performance de categorias com métricas avançadas
      const categoryPerformance = await DonationService.aggregate([
        { $match: { deleted: false } },
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
            totalDonations: { $sum: 1 },
            totalValue: { $sum: { $ifNull: ['$estimatedValue', 0] } },
            totalQuantity: { $sum: '$quantity' },
            avgValue: { $avg: { $ifNull: ['$estimatedValue', 0] } },
            avgQuantity: { $avg: '$quantity' },
            pendingCount: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            },
            receivedCount: {
              $sum: { $cond: [{ $eq: ['$status', 'received'] }, 1, 0] }
            },
            distributedCount: {
              $sum: { $cond: [{ $eq: ['$status', 'distributed'] }, 1, 0] }
            },
            uniqueDonors: { $addToSet: '$donorName' },
            lastDonation: { $max: '$receivedDate' },
            firstDonation: { $min: '$receivedDate' }
          }
        },
        {
          $project: {
            categoryName: 1,
            categoryIcon: 1,
            categoryColor: 1,
            totalDonations: 1,
            totalValue: 1,
            totalQuantity: 1,
            avgValue: 1,
            avgQuantity: 1,
            pendingCount: 1,
            receivedCount: 1,
            distributedCount: 1,
            uniqueDonors: { $size: '$uniqueDonors' },
            lastDonation: 1,
            firstDonation: 1,
            efficiency: {
              $cond: [
                { $eq: ['$totalDonations', 0] },
                0,
                { $multiply: [{ $divide: ['$distributedCount', '$totalDonations'] }, 100] }
              ]
            }
          }
        },
        { $sort: { totalDonations: -1 } }
      ]);

      res.status(200).json({
        message: "Performance de categorias obtida com sucesso",
        data: categoryPerformance
      });
    } catch (error) {
      throw error;
    }
  }),
];

export const getDonorAnalytics = [
  QueryHandler(periodSchema),
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const { startDate, endDate } = req.query as any;
      
      let dateFilter: any = {};
      if (startDate && endDate) {
        dateFilter = {
          receivedDate: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        };
      }

      const [donorStats, donorSegmentation] = await Promise.all([
        // Estatísticas detalhadas dos doadores
        DonationService.aggregate([
          { $match: { deleted: false, ...dateFilter } },
          {
            $group: {
              _id: '$donorName',
              contact: { $first: '$donorContact' },
              totalDonations: { $sum: 1 },
              totalValue: { $sum: { $ifNull: ['$estimatedValue', 0] } },
              avgValue: { $avg: { $ifNull: ['$estimatedValue', 0] } },
              categories: { $addToSet: '$categoryId' },
              firstDonation: { $min: '$receivedDate' },
              lastDonation: { $max: '$receivedDate' },
              pendingDonations: {
                $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
              },
              receivedDonations: {
                $sum: { $cond: [{ $eq: ['$status', 'received'] }, 1, 0] }
              },
              distributedDonations: {
                $sum: { $cond: [{ $eq: ['$status', 'distributed'] }, 1, 0] }
              }
            }
          },
          {
            $project: {
              donorName: '$_id',
              contact: 1,
              totalDonations: 1,
              totalValue: 1,
              avgValue: 1,
              categoriesCount: { $size: '$categories' },
              firstDonation: 1,
              lastDonation: 1,
              pendingDonations: 1,
              receivedDonations: 1,
              distributedDonations: 1,
              daysSinceFirst: {
                $divide: [
                  { $subtract: [new Date(), '$firstDonation'] },
                  1000 * 60 * 60 * 24
                ]
              },
              daysSinceLast: {
                $divide: [
                  { $subtract: [new Date(), '$lastDonation'] },
                  1000 * 60 * 60 * 24
                ]
              }
            }
          },
          { $sort: { totalValue: -1 } }
        ]),
        
        // Segmentação de doadores
        DonationService.aggregate([
          { $match: { deleted: false, ...dateFilter } },
          {
            $group: {
              _id: '$donorName',
              totalValue: { $sum: { $ifNull: ['$estimatedValue', 0] } },
              totalDonations: { $sum: 1 }
            }
          },
          {
            $bucket: {
              groupBy: '$totalValue',
              boundaries: [0, 50, 100, 250, 500, 1000, Infinity],
              default: 'Outros',
              output: {
                count: { $sum: 1 },
                avgDonations: { $avg: '$totalDonations' },
                totalValue: { $sum: '$totalValue' }
              }
            }
          }
        ])
      ]);

      res.status(200).json({
        message: "Analytics de doadores obtida com sucesso",
        data: {
          donorStats,
          segmentation: donorSegmentation
        }
      });
    } catch (error) {
      throw error;
    }
  }),
];

export const getEfficiencyMetrics = [
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    try {
      const [
        statusEfficiency,
        categoryEfficiency,
        timeMetrics
      ] = await Promise.all([
        // Eficiência por status
        DonationService.aggregate([
          { $match: { deleted: false } },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
              avgValue: { $avg: { $ifNull: ['$estimatedValue', 0] } },
              avgProcessingTime: {
                $avg: {
                  $divide: [
                    { $subtract: ['$updatedAt', '$createdAt'] },
                    1000 * 60 * 60 * 24 // dias
                  ]
                }
              }
            }
          }
        ]),
        
        // Eficiência por categoria
        DonationService.aggregate([
          { $match: { deleted: false } },
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
              totalDonations: { $sum: 1 },
              distributedCount: {
                $sum: { $cond: [{ $eq: ['$status', 'distributed'] }, 1, 0] }
              },
              avgProcessingTime: {
                $avg: {
                  $divide: [
                    { $subtract: ['$updatedAt', '$createdAt'] },
                    1000 * 60 * 60 * 24
                  ]
                }
              }
            }
          },
          {
            $project: {
              categoryName: 1,
              totalDonations: 1,
              distributedCount: 1,
              avgProcessingTime: 1,
              distributionRate: {
                $multiply: [
                  { $divide: ['$distributedCount', '$totalDonations'] },
                  100
                ]
              }
            }
          }
        ]),
        
        // Métricas de tempo
        DonationService.aggregate([
          { $match: { deleted: false, status: { $ne: 'pending' } } },
          {
            $project: {
              processingDays: {
                $divide: [
                  { $subtract: ['$updatedAt', '$createdAt'] },
                  1000 * 60 * 60 * 24
                ]
              }
            }
          },
          {
            $group: {
              _id: null,
              avgProcessingTime: { $avg: '$processingDays' },
              minProcessingTime: { $min: '$processingDays' },
              maxProcessingTime: { $max: '$processingDays' },
              totalProcessed: { $sum: 1 }
            }
          }
        ])
      ]);

      res.status(200).json({
        message: "Métricas de eficiência obtidas com sucesso",
        data: {
          statusEfficiency,
          categoryEfficiency,
          overallMetrics: timeMetrics[0] || {}
        }
      });
    } catch (error) {
      throw error;
    }
  }),
];
