import mongoose, { ObjectId } from "mongoose";
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

  async listPaginated(options: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{
    data: IEvent[];
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  }> {
    const { page = 1, limit = 10, search = "" } = options;

    const filters: any = { deleted: false };
    if (search.trim()) {
      filters.$or = [
        { title: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
        { location: { $regex: search.trim(), $options: "i" } },
      ];
    }

    return this.paginate({ filters, page, limit });
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
      
      const updatedData = { ...data, image: `https://ong-sementes.s3.sa-east-1.amazonaws.com/${imagePath}` };
      return (await super.updateOne(event._id, updatedData)) as IEvent;
    }

    return event;
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

      data.image = `https://ong-sementes.s3.sa-east-1.amazonaws.com/${imagePath}`;
    }

    return super.updateOne(id, data);
  }

  async addVolunteerToEvent(eventId: string | ObjectId, volunteerId: string | ObjectId): Promise<IEvent | null> {
    const event = await EventModel.findById(eventId);
    if (!event) {
      throw new NotFoundError("event_not_found", "Event não encontrado.");
    }

    const volunteerObjectId = new mongoose.Types.ObjectId(volunteerId.toString());
    
    // Verifica se o voluntário já está no evento
    if (event.volunteers.some(vol => vol.toString() === volunteerObjectId.toString())) {
      return event.toObject();
    }

    // Verifica se há limite máximo de voluntários
    if (event.maxVolunteers && event.volunteers.length >= event.maxVolunteers) {
      throw new Error("Número máximo de voluntários atingido para este evento.");
    }

    event.volunteers.push(volunteerObjectId as any);
    await event.save();
    
    return this.findById(eventId);
  }

  async removeVolunteerFromEvent(eventId: string | ObjectId, volunteerId: string | ObjectId): Promise<IEvent | null> {
    const event = await EventModel.findById(eventId);
    if (!event) {
      throw new NotFoundError("event_not_found", "Event não encontrado.");
    }

    event.volunteers = event.volunteers.filter(
      (vol: any) => vol.toString() !== volunteerId.toString()
    ) as any;
    await event.save();
    
    return this.findById(eventId);
  }

  async getEventWithVolunteers(eventId: string | ObjectId): Promise<IEvent | null> {
    const events = await EventModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(eventId.toString()), deleted: false } },
      {
        $lookup: {
          from: "volunteers",
          localField: "volunteers",
          foreignField: "_id",
          as: "volunteers",
        },
      },
    ]);

    return events[0] || null;
  }

  async getLastEvents(): Promise<IEvent[]> {
    const events = await EventModel
      .find({ deleted: false })
      .sort({ createdAt: -1 })
      .limit(3)
      .exec();

    // Retorna array vazio se não houver eventos
    return events || [];
  }
}

export const eventService = new EventService();
