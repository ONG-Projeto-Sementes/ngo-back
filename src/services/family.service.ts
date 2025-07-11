import { BaseService } from "../core/base-service/index.js";
import { IFamily, FamilyModel } from "../models/family.js";
import { BeneficiaryService } from "./beneficiary.service.js";
import { DonationDistributionService } from "./donation-distribution.service.js";
import { DonationDistributionModel } from "../models/donation-distribution.js";
import { NotFoundError } from "../errors/not-found.error.js";

export class FamilyService extends BaseService<IFamily> {
  private distributionService: DonationDistributionService;

  constructor(private beneficiaryService: BeneficiaryService) {
    super(FamilyModel);
    this.distributionService = new DonationDistributionService();
  }

  async deleteOneById(id: string): Promise<IFamily | null> {
    await this.beneficiaryService.updateMany({
      filters: {
        family: id,
      },
      data: {
        $unset: { family: true },
      },
    });

    return super.deleteOne({
      filters: {
        _id: id,
      },
    });
  }

  // Buscar histórico de doações de uma família
  async getDonationHistory(familyId: string) {
    const family = await this.findById(familyId);
    if (!family) {
      throw new NotFoundError("family_not_found", "Família não encontrada");
    }

    return await this.distributionService.list({
      filters: { familyId: familyId },
      populate: ['donationId']
    });
  }

  // Buscar família por ID com histórico de doações
  async findByIdWithDonationHistory(id: string) {
    const family = await this.findById(id);
    if (!family) {
      throw new NotFoundError("family_not_found", "Família não encontrada");
    }

    // Buscar histórico de doações recebidas
    const donationHistory = await this.getDonationHistory(id);

    // Converter family para objeto plano se for um documento Mongoose
    const familyObj = (family as any).toObject ? (family as any).toObject() : { ...family };

    return {
      ...familyObj,
      donationHistory,
      totalDonationsReceived: donationHistory.length,
      totalQuantityReceived: donationHistory.reduce((sum, dist) => sum + dist.quantity, 0)
    };
  }

  // Buscar famílias com estatísticas de doações
  async findWithDonationStats(filters: any = {}) {
    const families = await this.list({ filters });
    
    // Adicionar estatísticas de doações para cada família
    for (const family of families) {
      const donationHistory = await this.getDonationHistory(family._id.toString());
      (family as any).totalDonationsReceived = donationHistory.length;
      (family as any).totalQuantityReceived = donationHistory.reduce((sum, dist) => sum + dist.quantity, 0);
      (family as any).lastDonationDate = donationHistory.length > 0 ? donationHistory[0].distributionDate : null;
    }

    return families;
  }

  // Listar famílias com paginação e filtros
  async listWithPagination(options: {
    page?: number;
    limit?: number;
    search?: string;
    city?: string;
    neighborhood?: string;
  }) {
    const { page = 1, limit = 10, search, city, neighborhood } = options;
    
    const filters: any = { deleted: false };
    
    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { contact: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (city) {
      filters.city = { $regex: city, $options: 'i' };
    }
    
    if (neighborhood) {
      filters.neighborhood = { $regex: neighborhood, $options: 'i' };
    }

    return this.paginate({ filters, page, limit });
  }

  // Obter estatísticas gerais de famílias
  async getFamilyStats() {
    const totalFamilies = await this.count({ filters: { deleted: false } });
    
    // Estatísticas por cidade
    const citiesStats = await this.aggregate([
      { $match: { deleted: false } },
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Estatísticas por bairro
    const neighborhoodsStats = await this.aggregate([
      { $match: { deleted: false } },
      { $group: { _id: '$neighborhood', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    return {
      totalFamilies,
      citiesStats,
      neighborhoodsStats
    };
  }

}

const beneficiaryService = new BeneficiaryService();
export default new FamilyService(beneficiaryService);
