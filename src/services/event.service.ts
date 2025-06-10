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
          ...(filters.familyId ? { familyId: filters.familyId } : {}),
          ...(filters.volunteerIds
            ? { volunteerIds: { $in: filters.volunteerIds } }
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
        $lookup: {
          from: "families",
          localField: "familyId",
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
          localField: "donationId",
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
          localField: "volunteerIds",
          foreignField: "_id",
          as: "volunteers",
        },
      },
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
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

    event.volunteerIds = [
      ...new Set([...(event.volunteerIds || []), ...(volunteerIds || [])]),
    ];
    return this.updateOne(eventId, { volunteerIds: event.volunteerIds });
  }
}

export default new EventService();
