import { BaseService } from "../core/base-service/index.js";
import { IDonation, DonationModel } from "../models/donation.js";
import { NotFoundError } from "../errors/not-found.error.js";
import { BadRequestError } from "../errors/bad-request.error.js";
import { DonationCategoryService } from "./donation-category.service.js";
import { DonationDistributionService } from "./donation-distribution.service.js";
import mongoose from "mongoose";

export class DonationService extends BaseService<IDonation> {
  private categoryService: DonationCategoryService;
  private distributionService: DonationDistributionService;

  constructor() {
    super(DonationModel);
    this.categoryService = new DonationCategoryService();
    this.distributionService = new DonationDistributionService();
  }

  // Validar se a categoria existe e está ativa
  async validateCategory(categoryId: string): Promise<void> {
    console.log('🔍 Validating category ID:', categoryId);
    console.log('🔍 Category ID type:', typeof categoryId);
    console.log('🔍 Is valid ObjectId:', mongoose.Types.ObjectId.isValid(categoryId));
    
    // Primeiro, verificar se a categoria existe (independente do isActive)
    const categoryExists = await this.categoryService.findOne({
      filters: { _id: categoryId }
    });
    console.log('🏷️ Category exists (any status):', categoryExists);
    
    // Depois, verificar se existe e está ativa
    const category = await this.categoryService.findOne({
      filters: { _id: categoryId, isActive: true }
    });

    console.log('🏷️ Found active category:', category);

    if (!category) {
      console.log('❌ Category not found or inactive');
      if (categoryExists) {
        console.log('⚠️ Category exists but is not active:', categoryExists);
        throw new BadRequestError(
          "inactive_category",
          "Categoria está inativa"
        );
      } else {
        console.log('❌ Category does not exist');
        throw new BadRequestError(
          "invalid_category",
          "Categoria não encontrada"
        );
      }
    }
    
    console.log('✅ Category validation passed');
  }

  // Override do insert para validar categoria
  async insert(data: Omit<IDonation, '_id' | 'createdAt' | 'updatedAt'>): Promise<IDonation> {
    await this.validateCategory(data.categoryId.toString());
    return super.insert(data);
  }

  // Override do updateOne para validar categoria
  async updateOne(id: string, data: Partial<IDonation>): Promise<IDonation | null> {
    if (data.categoryId) {
      await this.validateCategory(data.categoryId.toString());
    }

    const updated = await super.updateOne(id, { 
      ...data, 
      updatedAt: new Date() 
    });
    
    if (!updated) {
      throw new NotFoundError("donation_not_found", "Doação não encontrada");
    }
    
    return updated;
  }

  // Buscar doações com populate da categoria e estatísticas de distribuição
  async findWithCategoryAndStats(filters: any = {}) {
    const donations = await DonationModel
      .find({ deleted: false, ...filters })
      .populate('categoryId', 'name defaultUnit icon color')
      .sort({ receivedDate: -1 })
      .lean()
      .exec();

    // Adicionar estatísticas de distribuição para cada doação
    for (const donation of donations) {
      try {
        const distributionService = new DonationDistributionService();
        const stats = await distributionService.getDonationStats(donation._id.toString());
        (donation as any).quantityDistributed = stats.quantityDistributed;
        (donation as any).quantityRemaining = stats.quantityRemaining;
        (donation as any).familiesCount = stats.familiesCount;
      } catch (error) {
        // Se houver erro ao buscar stats, usar valores padrão
        (donation as any).quantityDistributed = 0;
        (donation as any).quantityRemaining = donation.quantity;
        (donation as any).familiesCount = 0;
      }
    }

    return donations;
  }

  // Buscar doação por ID com categoria e estatísticas
  async findByIdWithCategoryAndStats(id: string) {
    const donation = await DonationModel
      .findById(id)
      .populate('categoryId', 'name defaultUnit icon color description')
      .lean()
      .exec();

    if (!donation) {
      throw new NotFoundError("donation_not_found", "Doação não encontrada");
    }

    // Adicionar estatísticas de distribuição
    try {
      const distributionService = new DonationDistributionService();
      const stats = await distributionService.getDonationStats(id);
      (donation as any).quantityDistributed = stats.quantityDistributed;
      (donation as any).quantityRemaining = stats.quantityRemaining;
      (donation as any).familiesCount = stats.familiesCount;
      (donation as any).distributionStats = stats.distributionStats;
    } catch (error) {
      // Se houver erro ao buscar stats, usar valores padrão
      (donation as any).quantityDistributed = 0;
      (donation as any).quantityRemaining = donation.quantity;
      (donation as any).familiesCount = 0;
      (donation as any).distributionStats = [];
    }

    return donation;
  }

  // Buscar doações com populate da categoria (método simplificado)
  async findWithCategory(filters: any = {}) {
    return DonationModel
      .find({ deleted: false, ...filters })
      .populate('categoryId', 'name defaultUnit icon color')
      .sort({ receivedDate: -1 })
      .exec();
  }

  // Buscar doação por ID com categoria (método simplificado)
  async findByIdWithCategory(id: string) {
    const donation = await DonationModel
      .findById(id)
      .populate('categoryId', 'name defaultUnit icon color description')
      .exec();

    if (!donation) {
      throw new NotFoundError("donation_not_found", "Doação não encontrada");
    }

    return donation;
  }

  // Atualizar status da doação
  async updateStatus(id: string, status: 'pending' | 'received' | 'distributed' | 'expired'): Promise<IDonation | null> {
    return this.updateOne(id, { status });
  }

  // Buscar doações por categoria
  async findByCategory(categoryId: string) {
    await this.validateCategory(categoryId);
    return this.findWithCategory({ categoryId });
  }

  // Buscar doações por status
  async findByStatus(status: 'pending' | 'received' | 'distributed' | 'expired') {
    return this.findWithCategory({ status });
  }

  // Estatísticas gerais de doações
  async getDonationStats() {
    const pipeline = [
      { $match: { deleted: false } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalValue: { $sum: { $ifNull: ['$estimatedValue', 0] } }
        }
      }
    ];

    return this.aggregate(pipeline);
  }

  // Estatísticas por categoria
  async getStatsByCategory() {
    const pipeline = [
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
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalValue: { $sum: { $ifNull: ['$estimatedValue', 0] } }
        }
      },
      { $sort: { count: -1 } }
    ];

    return this.aggregate(pipeline);
  }

  // Distribuir doação para famílias
  async distributeToFamilies(donationId: string, distributions: Array<{familyId: string, quantity: number, notes?: string}>) {
    const donation = await this.findById(donationId);
    if (!donation) {
      throw new NotFoundError("donation_not_found", "Doação não encontrada");
    }

    // Validar quantidade total
    const totalRequested = distributions.reduce((sum, dist) => sum + dist.quantity, 0);
    const distributionService = new DonationDistributionService();
    const stats = await distributionService.getDonationStats(donationId);
    
    if (totalRequested > stats.quantityRemaining) {
      throw new BadRequestError(
        "insufficient_quantity",
        `Quantidade total solicitada (${totalRequested}) excede a disponível (${stats.quantityRemaining})`
      );
    }

    // Criar distribuições
    const results = [];
    for (const dist of distributions) {
      const distribution = await distributionService.insert({
        donationId: new mongoose.Types.ObjectId(donationId),
        familyId: new mongoose.Types.ObjectId(dist.familyId),
        quantity: dist.quantity,
        notes: dist.notes,
        distributionDate: new Date(),
        status: 'pending'
      });
      results.push(distribution);
    }

    return results;
  }

  // Listar doações com paginação e filtros
  async listWithPagination(options: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }) {
    const { page = 1, limit = 10, search, categoryId, status, dateFrom, dateTo } = options;
    
    const filters: any = { deleted: false };
    
    if (search) {
      filters.$or = [
        { donorName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (categoryId) {
      filters.categoryId = categoryId;
    }
    
    if (status) {
      filters.status = status;
    }
    
    if (dateFrom || dateTo) {
      filters.receivedDate = {};
      if (dateFrom) filters.receivedDate.$gte = dateFrom;
      if (dateTo) filters.receivedDate.$lte = dateTo;
    }

    return this.paginate({ filters, page, limit });
  }
}

export default new DonationService();
