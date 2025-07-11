import Joi from "joi";

import { eventService } from "../services/event.service.js";
import { QueryHandler } from "../middlewares/QueryHandler.js";
import { AsyncHandler } from "../middlewares/AsyncHandler.js";
import { BodyHandler } from "../middlewares/BodyHandler.js";
import { FileHandler } from "../middlewares/FileHandler.js";
import { NotFoundError } from "../errors/not-found.error.js";

export const getEvents = [
  AsyncHandler(async (req, res) => {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const search = (req.query.search as string) || "";

    const result = await eventService.listPaginated({ page, limit, search });
    res.status(200).json(result);
  }),
];

export const getLastEvents = [
  AsyncHandler(async (req, res) => {
    const events = await eventService.getLastEvents();
    res.status(200).json(events);
  }),
];

export const getEvent = [
  AsyncHandler(async (req, res) => {
    const { id } = req.params;
    const event = await eventService.getEventWithVolunteers(id);
    
    if (!event) {
      throw new NotFoundError("event_not_found", "Evento não encontrado");
    }
    
    res.status(200).json(event);
  }),
];

export const createEvent = [
  FileHandler([{ name: "image", maxCount: 1 }]),
  BodyHandler(
    Joi.object({
      title: Joi.string().required(),
      description: Joi.string().optional(),
      location: Joi.string().optional(),
      startDate: Joi.date().required(),
      endDate: Joi.date().optional(),
      maxVolunteers: Joi.number().integer().min(1).optional(),
      volunteers: Joi.array().items(Joi.string()).optional(),
    }),
  ),
  AsyncHandler(async (req, res) => {
    res
      .status(201)
      .json(
        await eventService.insertOneWithImage(
          req.body,
          (req.files as { image: Express.Multer.File[] })?.image?.[0],
        ),
      );
  }),
];

export const updateEvent = [
  FileHandler([{ name: "image", maxCount: 1 }]),
  BodyHandler(
    Joi.object({
      title: Joi.string().optional(),
      description: Joi.string().optional(),
      location: Joi.string().optional(),
      startDate: Joi.date().optional(),
      endDate: Joi.date().optional(),
      maxVolunteers: Joi.number().integer().min(1).optional(),
      volunteers: Joi.array().items(Joi.string()).optional(),
    }),
  ),
  AsyncHandler(async (req, res) => {
    const { id } = req.params;

    res
      .status(200)
      .json(
        await eventService.updateOneWithImage(
          id,
          req.body,
          (req.files as { image: Express.Multer.File[] })?.image?.[0],
        ),
      );
  }),
];

export const deleteEvent = [
  AsyncHandler(async (req, res) => {
    const { id } = req.params;

    await eventService.deleteOne({ filters: { _id: id } });
    res.status(204).send();
  }),
];

export const addVolunteerToEvent = [
  BodyHandler(
    Joi.object({
      volunteerId: Joi.string().required(),
    }),
  ),
  AsyncHandler(async (req, res) => {
    const { id } = req.params;
    const { volunteerId } = req.body;

    const event = await eventService.addVolunteerToEvent(id, volunteerId);
    res.status(200).json(event);
  }),
];

export const removeVolunteerFromEvent = [
  AsyncHandler(async (req, res) => {
    const { id, volunteerId } = req.params;

    const event = await eventService.removeVolunteerFromEvent(id, volunteerId);
    res.status(200).json(event);
  }),
];
