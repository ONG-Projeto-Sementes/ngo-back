import mongoose from "mongoose";
import { BaseInterface } from "../types/base-interface.js";

export interface IDonationCategory extends BaseInterface {
  name: string;
  description?: string;
  defaultUnit: string; // ex: "unidades", "kg", "litros", "caixas"
  icon?: string; // nome do ícone para o frontend
  color?: string; // cor hexadecimal para categorização visual
  isActive: boolean;
}

const DonationCategorySchema = new mongoose.Schema<IDonationCategory>({
  name: { 
    type: String, 
    required: true,
    trim: true,
    index: true
  },
  description: { type: String, trim: true },
  defaultUnit: { 
    type: String, 
    required: true,
    trim: true
  },
  icon: { type: String },
  color: { 
    type: String,
    match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
    default: '#6B7280'
  },
  isActive: { type: Boolean, default: true },
  deleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const DonationCategoryModel = mongoose.model('DonationCategory', DonationCategorySchema);
