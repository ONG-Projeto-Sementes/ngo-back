import mongoose, { ObjectId } from "mongoose";
import { BaseInterface } from "../types/base-interface.js";
import { IVolunteer } from "./volunteer.js";

export interface IEvent extends BaseInterface {
  title: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate?: Date;
  maxVolunteers?: number;
  volunteers: ObjectId[] | IVolunteer[];
  image?: string;
}

const EventSchema = new mongoose.Schema<IEvent>({
  title: { type: String, required: true },
  description: { type: String },
  location: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  maxVolunteers: { type: Number },
  volunteers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Volunteer" }],
  image: { type: String },
  deleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const EventModel = mongoose.model("Event", EventSchema);
