import mongoose, { ObjectId } from "mongoose";
import { BaseInterface } from "../types/base-interface.js";
import {IVolunteer} from "./volunteer.js";
import {IDonation} from "./donation.js";
import {IFamily} from "./family.js";

export interface IEvent extends BaseInterface {
  donation: ObjectId | IDonation;
  volunteers: (ObjectId | string)[] | IVolunteer[];
  deliveryDate: Date;
  observations?: string;
  family: ObjectId | IFamily;
  imageUrl?: string;
}

const EventSchema = new mongoose.Schema<IEvent>({
  donation: { type: mongoose.Schema.Types.ObjectId, ref: 'Donation', required: true },
  volunteers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Volunteer', required: true }],
  deliveryDate: { type: Date, required: true },
  observations: { type: String },
  imageUrl: { type: String },
  family: { type: mongoose.Schema.Types.ObjectId, ref: 'Family', required: true },
  deleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const EventModel = mongoose.model('Event', EventSchema);
