import { BaseService } from "../core/base-service/index.js";
import { IVolunteer, VolunteerModel } from "../models/volunteer.js";
import { Mutable } from "../core/base-service/interface.js";
import { randomUUID } from "node:crypto";
import { fileApi } from "../apis/file.api.js";
import { ObjectId } from "mongoose";
import { NotFoundError } from "../errors/not-found.error.js";
<<<<<<< HEAD
import { BadRequestError } from "../errors/bad-request.error.js";
=======
>>>>>>> origin/main

export class VolunteerService extends BaseService<IVolunteer> {
  constructor() {
    super(VolunteerModel);
  }

  async insertOneWithImage(
    data: Mutable<IVolunteer>,
    image?: Express.Multer.File,
  ): Promise<IVolunteer> {
<<<<<<< HEAD
    if (data.cpf) {
      const exists = await VolunteerModel.findOne({ cpf: data.cpf, deleted: false });
      if (exists) {
        throw new BadRequestError("cpf_duplicate", "CPF já cadastrado");
      }
    }

    let volunteer;
    try {
      volunteer = (await super.insert(data)) as any;
    } catch (err: any) {
      if (err.code === 11000 && err.keyPattern?.cpf) {
        throw new BadRequestError("cpf_duplicate", "CPF já cadastrado");
      }
      throw err;
    }

    if (image) {
      const ext = image.originalname.split(".").pop();
      const imagePath = `volunteer/${volunteer._id}/${randomUUID()}.${ext}`;
      await fileApi.upload({ key: imagePath, data: image.buffer });
      volunteer.profilePicture = `https://ong-sementes.s3.sa-east-1.amazonaws.com/${imagePath}`;
      await volunteer.save();
    }

    return volunteer;
=======
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
>>>>>>> origin/main
  }

  async updateOneWithImage(
    id: string | ObjectId,
    data: Partial<IVolunteer>,
    image?: Express.Multer.File,
<<<<<<< HEAD
  ): Promise<IVolunteer> {
    const volunteer = await VolunteerModel.findById(id);
    if (!volunteer) {
      throw new NotFoundError("volunteer_not_found", "Voluntário não encontrado");
    }

    if (data.cpf && data.cpf !== volunteer.cpf) {
      const exists = await VolunteerModel.findOne({ cpf: data.cpf, deleted: false });
      if (exists) {
        throw new BadRequestError("cpf_duplicate", "CPF já cadastrado");
      }
    }

    Object.assign(volunteer, data);

    if (image) {
      const folder = await fileApi.list({ path: `volunteer/${volunteer._id}` });
      if (folder.Contents?.length) {
        await Promise.all(
          folder.Contents.map((f) =>
            f.Key ? fileApi.delete({ key: f.Key }) : Promise.resolve()
          )
        );
      }
      const ext = image.originalname.split(".").pop();
      const imagePath = `volunteer/${volunteer._id}/${randomUUID()}.${ext}`;
      await fileApi.upload({ key: imagePath, data: image.buffer });
      volunteer.profilePicture = `https://ong-sementes.s3.sa-east-1.amazonaws.com/${imagePath}`;
    }

    await volunteer.save();
    return volunteer;
=======
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
>>>>>>> origin/main
  }
}

export default new VolunteerService();
