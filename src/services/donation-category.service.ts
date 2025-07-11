import { BaseService } from "../core/base-service/index.js";
import { IDonationCategory, DonationCategoryModel } from "../models/donation-category.js";
import { ConflictError } from "../errors/conflict-error.js";
import { NotFoundError } from "../errors/not-found.error.js";

export class DonationCategoryService extends BaseService<IDonationCategory> {
  constructor() {
    super(DonationCategoryModel);
  }

  // Verifica se já existe uma categoria com o mesmo nome
  async checkDuplicateName(name: string, excludeId?: string): Promise<void> {
    const filters: any = { 
      name: { $regex: new RegExp(`^${name}$`, 'i') } // case insensitive
    };
    
    if (excludeId) {
      filters._id = { $ne: excludeId };
    }

    const existing = await this.findOne({ filters });
    if (existing) {
      throw new ConflictError(
        "duplicate_category_name",
        "Já existe uma categoria com este nome"
      );
    }
  }

  // Override do insert para verificar duplicatas
  async insert(data: Omit<IDonationCategory, '_id' | 'createdAt' | 'updatedAt'>): Promise<IDonationCategory> {
    await this.checkDuplicateName(data.name);
    return super.insert(data);
  }

  // Override do updateOne para verificar duplicatas
  async updateOne(id: string, data: Partial<IDonationCategory>): Promise<IDonationCategory | null> {
    if (data.name) {
      await this.checkDuplicateName(data.name, id);
    }

    const updated = await super.updateOne(id, { 
      ...data, 
      updatedAt: new Date() 
    });
    
    if (!updated) {
      throw new NotFoundError("category_not_found", "Categoria não encontrada");
    }
    
    return updated;
  }

  // Buscar categorias ativas
  async findActiveCategories(): Promise<IDonationCategory[]> {
    return this.list({
      filters: { isActive: true },
      select: { name: 1, description: 1, defaultUnit: 1, icon: 1, color: 1 }
    });
  }

  // Desativar categoria (soft delete)
  async deactivateCategory(id: string): Promise<IDonationCategory | null> {
    const updated = await this.updateOne(id, { 
      isActive: false,
      updatedAt: new Date()
    });
    
    if (!updated) {
      throw new NotFoundError("category_not_found", "Categoria não encontrada");
    }
    
    return updated;
  }

  // Ativar categoria
  async activateCategory(id: string): Promise<IDonationCategory | null> {
    const updated = await this.updateOne(id, { 
      isActive: true,
      updatedAt: new Date()
    });
    
    if (!updated) {
      throw new NotFoundError("category_not_found", "Categoria não encontrada");
    }
    
    return updated;
  }
}

export const donationCategoryService = new DonationCategoryService();
export default donationCategoryService;
