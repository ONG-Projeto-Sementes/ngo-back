import Joi from "joi";
import { BodyHandler } from "../middlewares/BodyHandler.js";
import { FileHandler } from "../middlewares/FileHandler.js";
import { NotFoundError } from "../errors/not-found.error.js";
import { AsyncHandler } from "../middlewares/AsyncHandler.js";
import { VolunteerService } from "../services/volunteer.service.js";

const volunteerService = new VolunteerService();

export const getVolunteers = [
  AsyncHandler(async (req, res) => {
    // lê page, limit e search da query string (defaults: 1, 10, "")
    const page  = parseInt(req.query.page  as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const search= (req.query.search as string)       || "";

    // usa o método paginado do service
    const { data, total, totalPages, currentPage, limit: lim } =
      await volunteerService.listPaginated({ page, limit, search });

    // devolve os dados + metadados
    res.status(200).json({
      data,
      total,
      totalPages,
      currentPage,
      limit: lim,
    });
  }),
];

export const getVolunteer = [
    AsyncHandler(async (req, res) => {
        const { id } = req.params;
        const volunteer = await volunteerService.findById(id);
        if (!volunteer || (volunteer as any).deleted) {
            throw new NotFoundError("volunteer_not_found", "Voluntário não encontrado");
        }
        res.status(200).json(volunteer);
    }),
];

export const createVolunteer = [
    FileHandler([{ name: "image", maxCount: 1 }]),
    BodyHandler(
        Joi.object({
            name: Joi.string().required(),
            cpf: Joi.string().optional(),
            contact: Joi.string().optional(),
            birthDate: Joi.date().optional(),
        }),
    ),
    AsyncHandler(async (req, res) => {
        const vol = await volunteerService.insertOneWithImage(
            req.body,
            (req.files as any)?.image?.[0],
        );
        res.status(201).json(vol);
    }),
];

export const updateVolunteer = [
    FileHandler([{ name: "image", maxCount: 1 }]),
    BodyHandler(
        Joi.object({
            name: Joi.string().optional(),
            cpf: Joi.string().optional(),
            contact: Joi.string().optional(),
            birthDate: Joi.date().optional(),
        }),
    ),
    AsyncHandler(async (req, res) => {
        const { id } = req.params;
        const vol = await volunteerService.updateOneWithImage(
            id,
            req.body,
            (req.files as any)?.image?.[0],
        );
        res.status(200).json(vol);
    }),
];

export const deleteVolunteer = [
    AsyncHandler(async (req, res) => {
        const { id } = req.params;
        const existing = await volunteerService.findById(id);
        if (!existing) {
            throw new NotFoundError("volunteer_not_found", "Voluntário não encontrado");
        }
        await volunteerService.updateOne(id, { deleted: true });
        res.status(204).send();
    }),
];
