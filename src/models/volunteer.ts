import mongoose from "mongoose";
import { BaseInterface } from "../types/base-interface.js";

export interface IVolunteer extends BaseInterface {
  name: string;
  contact?: string;
  profilePicture?: string;
  cpf?: string;
  birthDate?: Date;
}

const VolunteerSchema = new mongoose.Schema<IVolunteer>({
  name: { type: String, required: true },
  contact: { type: String },
  cpf: { type: String },
  profilePicture: { type: String },
  birthDate: { type: Date },
  deleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

VolunteerSchema.index(
  { cpf: 1 },
  { unique: true, partialFilterExpression: { deleted: false } },
);

export const VolunteerModel = mongoose.model("Volunteer", VolunteerSchema);
