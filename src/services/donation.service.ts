import { BaseService } from "../core/base-service/index.js";
import { IDonation, DonationModel } from "../models/donation.js";
import { NotFoundError } from "../errors/not-found.error.js";
import { BadRequestError } from "../errors/bad-request.error.js";
import DonationCategoryService from "./donation-category.service.js";

export class DonationService extends BaseService<IDonation> {
  constructor() {
    super(DonationModel);
  }

  // Validar se a categoria existe e está ativa
  async validateCategory(categoryId: string): Promise<void> {
    const category = await DonationCategoryService.findOne({
      filters: { _id: categoryId, isActive: true }
    });

    if (!category) {
      throw new BadRequestError(
        "invalid_category",
        "Categoria inválida ou inativa"
      );
    }
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

  // Buscar doações com populate da categoria
  async findWithCategory(filters: any = {}) {
    return DonationModel
      .find({ deleted: false, ...filters })
      .populate('categoryId', 'name defaultUnit icon color')
      .sort({ receivedDate: -1 })
      .exec();
  }

  // Buscar doação por ID com categoria
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

  // Estatísticas de doações
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
}

export default new DonationService();
