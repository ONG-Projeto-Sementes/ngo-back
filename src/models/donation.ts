import mongoose from "mongoose";
import { BaseInterface } from "../types/base-interface.js";

export interface IDonation extends BaseInterface {
  donorName: string;
  donorContact?: string;
  categoryId: mongoose.Types.ObjectId;
  quantity: number;
  unit: string; // ex: "unidades", "kg", "litros", "caixas"
  description?: string;
  estimatedValue?: number;
  receivedDate: Date;
  status: 'pending' | 'received' | 'distributed' | 'expired';
  images?: string[];
  notes?: string;
  // Campos virtuais calculados
  quantityDistributed?: number;
  quantityRemaining?: number;
  familiesCount?: number;
}

const DonationSchema = new mongoose.Schema<IDonation>({
  donorName: { type: String, required: true },
  donorContact: { type: String },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'DonationCategory', required: true },
  quantity: { type: Number, required: true, min: 0 },
  unit: { type: String, required: true },
  description: { type: String },
  estimatedValue: { type: Number, min: 0 },
  receivedDate: { type: Date, required: true, default: Date.now },
  status: { 
    type: String, 
    enum: ['pending', 'received', 'distributed', 'expired'], 
    default: 'pending' 
  },
  images: [{ type: String }],
  notes: { type: String },
  deleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Virtuais para campos calculados
DonationSchema.virtual('quantityDistributed').get(async function() {
  const distributions = await mongoose.model('DonationDistribution').find({
    donationId: this._id,
    status: 'delivered',
    deleted: false
  });
  return distributions.reduce((total, dist) => total + dist.quantity, 0);
});

DonationSchema.virtual('quantityRemaining').get(async function() {
  const distributed = await this.quantityDistributed;
  return this.quantity - (distributed || 0);
});

DonationSchema.virtual('familiesCount').get(async function() {
  const count = await mongoose.model('DonationDistribution').countDocuments({
    donationId: this._id,
    status: 'delivered',
    deleted: false
  });
  return count;
});

// Middleware para atualizar updatedAt
DonationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const DonationModel = mongoose.model('Donation', DonationSchema);
