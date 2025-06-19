import { BaseService } from "../core/base-service/index.js";
import { IVolunteer, VolunteerModel } from "../models/volunteer.js";
import { Mutable } from "../core/base-service/interface.js";
import { randomUUID } from "node:crypto";
import { fileApi } from "../apis/file.api.js";
import { ObjectId } from "mongoose";
import { NotFoundError } from "../errors/not-found.error.js";

export class VolunteerService extends BaseService<IVolunteer> {
  constructor() {
    super(VolunteerModel);
  }

  async insertOneWithImage(
    data: Mutable<IVolunteer>,
    image?: Express.Multer.File,
  ): Promise<IVolunteer> {
    const event = await super.insert(data);

    if (image) {
      const imagePath = `volunteer/${
        event._id
      }/${randomUUID()}.${image.originalname.split(".").pop()}`;

      await fileApi.upload({
        key: imagePath,
        data: image.buffer,
      });
      data.profilePicture = `https://ong-sementes.s3.sa-east-1.amazonaws.com/${imagePath}`;
    }

    return (await super.updateOne(event._id, data)) as IVolunteer;
  }

  async updateOneWithImage(
    id: string | ObjectId,
    data: Partial<IVolunteer>,
    image?: Express.Multer.File,
  ): Promise<IVolunteer | null> {
    const event = await super.findById(id);

    if (!event) {
      throw new NotFoundError("event_not_found", "Event não encontrado.");
    }

    if (image) {
      const folder = await fileApi.list({
        path: `volunteer/${event._id.toString()}`,
      });
      if (folder && folder.Contents?.length) {
        const promises = folder.Contents.map(async (folderFile) =>
          folderFile.Key
            ? fileApi.delete({ key: folderFile.Key })
            : Promise.resolve(),
        );
        await Promise.all(promises);
      }

      const imagePath = `volunteer/${
        event._id
      }/${randomUUID()}.${image.originalname.split(".").pop()}`;
      await fileApi.upload({
        key: imagePath,
        data: image.buffer,
      });

      data.profilePicture = `https://ong-sementes.s3.sa-east-1.amazonaws.com/${imagePath}`;
    }

    return super.updateOne(id, data);
  }
}

export default new VolunteerService();
