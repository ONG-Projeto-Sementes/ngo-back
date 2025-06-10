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
      .find(filters ? { deleted: false, ...filters } : { deleted: false })
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
      .findOne(filters ? { deleted: false, ...filters } : { deleted: false })
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
    return this.model
      .countDocuments(filters ? { deleted: false, ...filters } : {})
      .exec();
  }

  disableOne(id: string | ObjectId): Promise<M | null> {
    return this.model
      .findByIdAndUpdate(id, { deleted: true }, { new: true })
      .exec();
  }

  async disableMany({
    filters,
  }: {
    filters?: RootFilterQuery<M>;
  }): Promise<M[] | null> {
    return this.model
      .updateMany(filters ? { deleted: false, ...filters } : {}, {
        deleted: true,
      })
      .exec()
      .then(() => this.list({ filters }));
  }

  deleteOne({ filters }: { filters?: RootFilterQuery<M> }): Promise<M | null> {
    return this.model.findOneAndDelete(filters).exec();
  }

  async aggregate(pipeline: any[]): Promise<any[]> {
    return this.model.aggregate(pipeline).exec();
  }

  async paginate({
    filters,
    page = 1,
    limit = 10,
  }: {
    filters?: RootFilterQuery<M>;
    page?: number;
    limit?: number;
  }): Promise<{
    data: M[];
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  }> {
    const res = await this.model
      .aggregate([
        {
          $match: {
            ...(filters ? { deleted: false, ...filters } : { deleted: false }),
          },
        },
        {
          $sort: { _id: 1 },
        },
        {
          $facet: {
            metadata: [{ $count: "total" }],
            data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
          },
        },
      ])
      .exec();

    const total = res[0]?.metadata[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);
    return {
      data: res[0]?.data || [],
      total,
      totalPages,
      currentPage: page,
      limit,
    };
  }
}
