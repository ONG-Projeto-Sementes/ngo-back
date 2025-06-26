import Joi from "joi";
import express from "express";

import { BodyHandler } from "../middlewares/BodyHandler.js";
import { AsyncHandler } from "../middlewares/AsyncHandler.js";
import { DonationService } from "../services/donation.service.js";

const donationService = new DonationService();

export const getDonations = [
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    res.status(200).json(await donationService.list({}));
  }),
];

export const createDonation = [
  BodyHandler(
    Joi.object({
      name: Joi.string().required(),
      description: Joi.string(),
    }),
  ),
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    res.status(201).json(await donationService.insert(req.body));
  }),
];

export const updateDonation = [
  BodyHandler(
    Joi.object({
      name: Joi.string().required(),
      description: Joi.string(),
    }),
  ),
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    res.status(200).json(await donationService.updateOne(id, req.body));
  }),
];

export const deleteDonation = [
  AsyncHandler(async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    await donationService.deleteOne({ filters: { _id: id } });
    res.status(204).send();
  }),
];
