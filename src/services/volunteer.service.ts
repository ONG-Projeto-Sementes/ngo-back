import { BaseService } from "../core/base-service/index.js";
import { IVolunteer, VolunteerModel } from "../models/volunteer.js";
import { Mutable } from "../core/base-service/interface.js";
import { randomUUID } from "node:crypto";
import { fileApi } from "../apis/file.api.js";
import { ObjectId } from "mongoose";
import { NotFoundError } from "../errors/not-found.error.js";
import { BadRequestError } from "../errors/bad-request.error.js";

export class VolunteerService extends BaseService<IVolunteer> {
  constructor() {
    super(VolunteerModel);
  }

  async insertOneWithImage(
      data: Mutable<IVolunteer>,
      image?: Express.Multer.File,
  ): Promise<IVolunteer> {
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
  }

  async updateOneWithImage(
      id: string | ObjectId,
      data: Partial<IVolunteer>,
      image?: Express.Multer.File,
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
  }
}

export default new VolunteerService();
