import mongoose, { ObjectId } from "mongoose";
import { BaseInterface } from "../types/base-interface.js";

export interface IBeneficiary extends BaseInterface {
  name: string;
  familyId: ObjectId;
  birthDate: Date;
  cpf?: string;
}

const BeneficiarySchema = new mongoose.Schema<IBeneficiary>({
  name: { type: String, required: true },
  cpf: { type: String, unique: true },
  familyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Family', required: true },
  birthDate: { type: Date, required: true },
  deleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const BeneficiaryModel = mongoose.model('Beneficiary', BeneficiarySchema);
