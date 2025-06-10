import mongoose, { ObjectId } from "mongoose";
import { BaseInterface } from "../types/base-interface.js";

export interface IEvent extends BaseInterface {
  donationId: ObjectId;
  volunteerIds: (ObjectId | string)[];
  deliveryDate: Date;
  observations?: string;
  familyId: ObjectId;
  imageUrl?: string;
}

const EventSchema = new mongoose.Schema<IEvent>({
  donationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Donation', required: true },
  volunteerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Volunteer', required: true }],
  deliveryDate: { type: Date, required: true },
  observations: { type: String },
  imageUrl: { type: String },
  familyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Family', required: true },
  deleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const EventModel = mongoose.model('Event', EventSchema);
