import { ObjectId, PopulateOptions, RootFilterQuery } from "mongoose";

export type Select =
  | string
  | string[]
  | Record<string, string | number | boolean | object>;
export type Populate = PopulateOptions | (string | PopulateOptions)[];

export type Mutable<T extends object> = Omit<
  T,
  "_id" | "createdAt" | "updatedAt"
>;

export interface IService<M extends object> {
  list({
    filters,
    populate,
    select,
  }: {
    filters?: RootFilterQuery<M>;
    populate?: Populate;
    select?: Select;
  }): Promise<M[]>;

  insert(data: Mutable<M>): Promise<M>;

  findById(id: ObjectId): Promise<M | null>;

  findOne({
    filters,
    populate,
    select,
  }: {
    filters?: RootFilterQuery<M>;
    populate?: Populate;
    select?: Select;
  }): Promise<M | null>;

  updateOne(id: string | ObjectId, data: Partial<M>): Promise<M | null>;

  count({ filters }: { filters?: RootFilterQuery<M> }): Promise<number>;

  disableOne(id: string | ObjectId): Promise<M | null>;

  disableMany({ filters }: { filters?: RootFilterQuery<M> }): Promise<M[] | null>;

  deleteOne({ filters }: { filters?: RootFilterQuery<M> }): Promise<M | null>;

  aggregate<T = any>(
    pipeline: any[],
    options?: { allowDiskUse?: boolean; collation?: object },
  ): Promise<T[]>;

  paginate({
    filters,
    page,
    limit,
  }: {
    filters: RootFilterQuery<M>;
    page?: number;
    limit?: number;
  }): Promise<{
    data: M[];
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  }>;
}
