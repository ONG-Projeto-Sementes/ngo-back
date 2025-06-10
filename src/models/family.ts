import mongoose from "mongoose";
import { BaseInterface } from "../types/base-interface.js";

export interface IFamily extends BaseInterface {
  city: string;
  neighborhood: string;
  contact?: string;
  address?: string;
  name: string;
}

const FamilySchema = new mongoose.Schema<IFamily>({
  city: { type: String, required: true },
  neighborhood: { type: String, required: true },
  contact: { type: String },
  address: { type: String },
  name: { type: String, required: true },
  deleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const FamilyModel = mongoose.model('Family', FamilySchema);
