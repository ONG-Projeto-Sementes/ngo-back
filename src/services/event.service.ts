import { BaseService } from "../core/base-service/index.js";
import { IEvent, EventModel } from "../models/event.js";
import { NotFoundError } from "../errors/not-found.error.js";

export class EventService extends BaseService<IEvent> {
  constructor() {
    super(EventModel);
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
              $skip: (page - 1) * limit
            },
            {
              $limit: limit
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
              }
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
              }
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

  async associateVolunteersByEventId(eventId: string, volunteerIds: string[]) {
    const event = await this.findById(eventId);
    if (!event) {
      throw new NotFoundError("event_not_found", "Evento não encontrado");
    }

    event.volunteers = [
      ...new Set([...(event.volunteers || []), ...(volunteerIds || [])]),
    ] as string[];
    return this.updateOne(eventId, { volunteers: event.volunteers });
  }
}

export default new EventService();
