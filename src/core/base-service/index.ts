import { Model, ObjectId, PopulateOptions, RootFilterQuery } from "mongoose";
import { IService, Mutable, Select } from "./interface.js";

export class BaseService<M extends object> implements IService<M> {
  constructor(private model: Model<M>) {
    this.model = model;
  }

  list({
    filters,
    populate,
    select,
  }: {
    filters?: RootFilterQuery<M>;
    populate?: PopulateOptions | (string | PopulateOptions)[];
    select?: Select;
  }): Promise<M[]> {
    return this.model
      .find(filters || {})
      .populate(populate || [])
      .select(select || {})
      .exec();
  }

  async insert(data: Mutable<M>): Promise<M> {
    const result = await this.model.create({ ...data, deleted: false });
    return result.toObject();
  }

  findOne({
    filters,
    populate,
    select,
  }: {
    filters?: RootFilterQuery<M>;
    populate?: PopulateOptions | (string | PopulateOptions)[];
    select?: Select;
  }): Promise<M | null> {
    return this.model
      .findOne(filters || {})
      .populate(populate || [])
      .select(select || {})
      .exec();
  }

  findById(id: ObjectId | string): Promise<M | null> {
    return this.model.findById(id).exec();
  }

  updateOne(id: string | ObjectId, data: Partial<M>): Promise<M | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  count({ filters }: { filters?: RootFilterQuery<M> }): Promise<number> {
    return this.model.countDocuments(filters || {}).exec();
  }

  deleteOne({ filters }: { filters?: RootFilterQuery<M> }): Promise<M | null> {
    return this.model.findOneAndDelete(filters || {}).exec();
  }
}
