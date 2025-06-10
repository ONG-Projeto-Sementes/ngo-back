import mongoose from "mongoose";
import { BaseInterface } from "../types/base-interface.js";

export interface IDonation extends BaseInterface {
  description: string;
  name: string;
}

const DonationSchema = new mongoose.Schema<IDonation>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  deleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const DonationModel = mongoose.model('Donation', DonationSchema);
