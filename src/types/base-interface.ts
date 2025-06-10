import { ObjectId } from "mongoose";

export interface BaseInterface {
  createdAt: Date;
  updatedAt: Date;
  _id: ObjectId;
  deleted?: boolean;
}