import { BaseService } from "../core/base-service/index.js";
import { IDonationDistribution, DonationDistributionModel } from "../models/donation-distribution.js";
import { DonationModel } from "../models/donation.js";
import { FamilyModel } from "../models/family.js";
import { NotFoundError } from "../errors/not-found.error.js";
import { BadRequestError } from "../errors/bad-request.error.js";
import mongoose from "mongoose";

export class DonationDistributionService extends BaseService<IDonationDistribution> {
  constructor() {
    super(DonationDistributionModel);
  }

  // Validar se a doação existe e tem quantidade disponível
  async validateDonationAndQuantity(donationId: string, requestedQuantity: number, excludeDistributionId?: string): Promise<void> {
    const donation = await DonationModel.findById(donationId);
    if (!donation) {
      throw new NotFoundError("donation_not_found", "Doação não encontrada");
    }

    // Calcular quantidade já distribuída
    const distributedQuery: any = { 
      donationId: new mongoose.Types.ObjectId(donationId), 
      status: { $ne: 'cancelled' },
      deleted: false
    };
    if (excludeDistributionId) {
      distributedQuery._id = { $ne: new mongoose.Types.ObjectId(excludeDistributionId) };
    }

    const distributedResult = await this.aggregate([
      { $match: distributedQuery },
      { $group: { _id: null, total: { $sum: '$quantity' } } }
    ]);

    const quantityDistributed = distributedResult[0]?.total || 0;
    const quantityAvailable = donation.quantity - quantityDistributed;

    if (requestedQuantity > quantityAvailable) {
      throw new BadRequestError(
        "insufficient_quantity",
        `Quantidade solicitada (${requestedQuantity}) excede a disponível (${quantityAvailable})`
      );
    }
  }

  // Validar se a família existe
  async validateFamily(familyId: string): Promise<void> {
    const family = await FamilyModel.findById(familyId);
    if (!family) {
      throw new NotFoundError("family_not_found", "Família não encontrada");
    }
  }

  // Override do insert para validações
  async insert(data: Omit<IDonationDistribution, '_id' | 'createdAt' | 'updatedAt'>): Promise<IDonationDistribution> {
    await this.validateFamily(data.familyId.toString());
    await this.validateDonationAndQuantity(data.donationId.toString(), data.quantity);
    
    return super.insert(data);
  }

  // Override do updateOne para validações
  async updateOne(id: string, data: Partial<IDonationDistribution>): Promise<IDonationDistribution | null> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundError("distribution_not_found", "Distribuição não encontrada");
    }

    if (data.familyId) {
      await this.validateFamily(data.familyId.toString());
    }

    if (data.quantity) {
      const donationId = data.donationId?.toString() || existing.donationId.toString();
      await this.validateDonationAndQuantity(donationId, data.quantity, id);
    }

    const updated = await super.updateOne(id, { 
      ...data, 
      updatedAt: new Date() 
    });
    
    if (!updated) {
      throw new NotFoundError("distribution_not_found", "Distribuição não encontrada");
    }
    
    return updated;
  }

  // Buscar distribuições de uma doação específica
  async findByDonation(donationId: string) {
    return DonationDistributionModel
      .find({ donationId, deleted: false })
      .populate('familyId', 'name city neighborhood contact')
      .sort({ distributionDate: -1 })
      .exec();
  }

  // Buscar histórico de doações de uma família
  async findByFamily(familyId: string) {
    return DonationDistributionModel
      .find({ familyId, deleted: false })
      .populate('donationId', 'donorName description quantity unit estimatedValue receivedDate')
      .populate({
        path: 'donationId',
        populate: {
          path: 'categoryId',
          select: 'name defaultUnit icon color'
        }
      })
      .sort({ distributionDate: -1 })
      .exec();
  }

  // Distribuir doação para uma família
  async distributeToFamily(donationId: string, familyId: string, quantity: number, notes?: string) {
    const distribution = await this.insert({
      donationId: new mongoose.Types.ObjectId(donationId),
      familyId: new mongoose.Types.ObjectId(familyId),
      quantity,
      distributionDate: new Date(),
      notes,
      status: 'pending'
    });

    // Atualizar status da doação se toda a quantidade foi distribuída
    await this.updateDonationStatus(donationId);

    return distribution;
  }

  // Atualizar status da doação baseado nas distribuições
  async updateDonationStatus(donationId: string) {
    const donation = await DonationModel.findById(donationId);
    if (!donation) return;

    const distributedResult = await this.aggregate([
      { $match: { 
        donationId: new mongoose.Types.ObjectId(donationId), 
        status: { $ne: 'cancelled' },
        deleted: false
      }},
      { $group: { _id: null, total: { $sum: '$quantity' } } }
    ]);

    const quantityDistributed = distributedResult[0]?.total || 0;

    let newStatus = donation.status;
    if (quantityDistributed >= donation.quantity) {
      newStatus = 'distributed';
    } else if (quantityDistributed > 0 && donation.status === 'pending') {
      newStatus = 'received';
    }

    if (newStatus !== donation.status) {
      await DonationModel.findByIdAndUpdate(donationId, { 
        status: newStatus,
        updatedAt: new Date()
      });
    }
  }

  // Cancelar distribuição
  async cancelDistribution(id: string): Promise<IDonationDistribution | null> {
    const distribution = await this.updateOne(id, { 
      status: 'cancelled',
      updatedAt: new Date()
    });

    if (distribution) {
      // Recalcular status da doação
      await this.updateDonationStatus(distribution.donationId.toString());
    }

    return distribution;
  }

  // Confirmar entrega da distribuição
  async confirmDelivery(id: string): Promise<IDonationDistribution | null> {
    return this.updateOne(id, { 
      status: 'delivered',
      updatedAt: new Date()
    });
  }

  // Obter estatísticas de distribuição de uma doação
  async getDonationStats(donationId: string) {
    const donation = await DonationModel.findById(donationId);
    if (!donation) {
      throw new NotFoundError("donation_not_found", "Doação não encontrada");
    }

    const pipeline = [
      { $match: { 
        donationId: new mongoose.Types.ObjectId(donationId), 
        deleted: false 
      }},
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' }
        }
      }
    ];

    const stats = await this.aggregate(pipeline);
    const totalDistributed = stats.reduce((sum, stat) => 
      stat._id !== 'cancelled' ? sum + stat.totalQuantity : sum, 0
    );

    return {
      donationQuantity: donation.quantity,
      quantityDistributed: totalDistributed,
      quantityRemaining: donation.quantity - totalDistributed,
      distributionStats: stats,
      familiesCount: await DonationDistributionModel.countDocuments({
        donationId: new mongoose.Types.ObjectId(donationId),
        status: { $ne: 'cancelled' },
        deleted: false
      })
    };
  }
}

export const donationDistributionService = new DonationDistributionService();
export default donationDistributionService;
