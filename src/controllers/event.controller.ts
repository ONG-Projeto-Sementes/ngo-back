import Joi from "joi";
import express from "express";

import { EventService } from "../services/event.service.js";
import { QueryHandler } from "../middlewares/QueryHandler.js";
import { AsyncHandler } from "../middlewares/AsyncHandler.js";
import { BodyHandler } from "../middlewares/BodyHandler.js";

const eventService = new EventService();

export const paginateEvents = [
  QueryHandler(
    Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),

      familyId: Joi.string().optional(),
      volunteerIds: Joi.array().items(Joi.string()).optional(),
      startDate: Joi.date().optional(),
      endDate: Joi.date().optional(),
    }),
  ),
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    const { page, limit } = (req.query || {}) as {
      page: string;
      limit: string;
    };
    res.status(200).json(
      await eventService.paginate({
        filters: {
          familyId: req.query?.familyId as string,
          volunteerIds: (req.query?.volunteerIds as string)?.split(",") || [],
          startDate: req.query?.startDate
            ? new Date(req.query.startDate as string)
            : undefined,
          endDate: req.query?.endDate
            ? new Date(req.query.endDate as string)
            : undefined,
        },
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 10,
      }),
    );
  }),
];

export const createEvent = [
  BodyHandler(
    Joi.object({
      donation: Joi.string().required(),
      volunteers: Joi.array().items(Joi.string()).required(),
      deliveryDate: Joi.date().required(),
      observations: Joi.string().optional(),
      family: Joi.string().required(),
      imageUrl: Joi.string().uri().optional(),
    }),
  ),
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    res.status(201).json(await eventService.insert(req.body));
  }),
];

export const updateEvent = [
  BodyHandler(
    Joi.object({
      volunteerIds: Joi.array().items(Joi.string()).optional(),
      donation: Joi.string().optional(),
      deliveryDate: Joi.date().optional(),
      observations: Joi.string().optional(),
      family: Joi.string().optional(),
      imageUrl: Joi.string().uri().optional(),
    }),
  ),
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    const { id } = req.params;

    res.status(200).json(await eventService.updateOne(id, req.body));
  }),
];

export const deleteEvent = [
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    const { id } = req.params;

    await eventService.deleteOne({ filters: { _id: id } });
    res.status(204).send();
  }),
];
