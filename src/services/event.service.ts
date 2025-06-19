import { ObjectId } from "mongoose";
import { randomUUID } from "node:crypto";

import { BaseService } from "../core/base-service/index.js";
import { IEvent, EventModel } from "../models/event.js";
import { Mutable } from "../core/base-service/interface.js";
import { fileApi } from "../apis/file.api.js";
import { NotFoundError } from "../errors/not-found.error.js";

export class EventService extends BaseService<IEvent> {
  constructor() {
    super(EventModel);
  }

  async insertOneWithImage(
    data: Mutable<IEvent>,
    image?: Express.Multer.File,
  ): Promise<IEvent> {
    const event = await super.insert(data);

    if (image) {
      const imagePath = `events/${
        event._id
      }/${randomUUID()}.${image.originalname.split(".").pop()}`;

      await fileApi.upload({
        key: imagePath,
        data: image.buffer,
      });
      data.imageUrl = imagePath;
    }

    return (await super.updateOne(event._id, data)) as IEvent;
  }

  async updateOneWithImage(
    id: string | ObjectId,
    data: Partial<IEvent>,
    image?: Express.Multer.File,
  ): Promise<IEvent | null> {
    const event = await super.findById(id);

    if (!event) {
      throw new NotFoundError("event_not_found", "Event não encontrado.");
    }

    if (image) {
      const folder = await fileApi.list({
        path: `events/${event._id.toString()}`,
      });
      if (folder && folder.Contents?.length) {
        const promises = folder.Contents.map(async (folderFile) =>
          folderFile.Key
            ? fileApi.delete({ key: folderFile.Key })
            : Promise.resolve(),
        );
        await Promise.all(promises);
      }

      const imagePath = `events/${
        event._id
      }/${randomUUID()}.${image.originalname.split(".").pop()}`;
      await fileApi.upload({
        key: imagePath,
        data: image.buffer,
      });

      data.imageUrl = imagePath;
    }

    return super.updateOne(id, data);
  }

  async paginate({
    filters,
    page = 1,
    limit = 10,
  }: {
    filters: {
      familyId?: string;
      volunteerIds?: string[];
      startDate?: Date;
      endDate?: Date;
    };
    page?: number;
    limit?: number;
  }) {
    const events = await this.aggregate([
      {
        $match: {
          ...(filters.familyId ? { family: filters.familyId } : {}),
          ...(filters.volunteerIds?.length
            ? { volunteers: { $in: filters.volunteerIds } }
            : {}),
          ...(filters.startDate
            ? { startDate: { $gte: filters.startDate } }
            : {}),
          ...(filters.endDate ? { endDate: { $lte: filters.endDate } } : {}),
          deleted: false,
        },
      },
      {
        $sort: { startDate: 1 },
      },
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [
            {
              $skip: (page - 1) * limit,
            },
            {
              $limit: limit,
            },
            {
              $lookup: {
                from: "families",
                localField: "family",
                foreignField: "_id",
                as: "family",
              },
            },
            {
              $unwind: {
                path: "$family",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "donations",
                localField: "donation",
                foreignField: "_id",
                as: "donation",
              },
            },
            {
              $unwind: {
                path: "$donation",
              },
            },
            {
              $lookup: {
                from: "volunteers",
                localField: "volunteers",
                foreignField: "_id",
                as: "volunteers",
              },
            },
          ],
        },
      },
    ]);

    const total = events[0]?.metadata[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);
    return {
      data: events[0]?.data || [],
      total,
      totalPages,
      currentPage: page,
      limit,
    };
  }
}

export const eventService = new EventService();
