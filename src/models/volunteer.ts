import mongoose from "mongoose";
import { BaseInterface } from "../types/base-interface.js";

export interface IVolunteer extends BaseInterface {
  name: string;
  contact?: string;
  profilePicture?: string;
  cpf?: string;
}

const VolunteerSchema = new mongoose.Schema<IVolunteer>({
  name: { type: String, required: true },
  contact: { type: String },
  cpf: { type: String, unique: true },
  profilePicture: { type: String },
  deleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const VolunteerModel = mongoose.model('Volunteer', VolunteerSchema);
