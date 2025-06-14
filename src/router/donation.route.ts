import express from "express";
import {
  createDonation,
  getDonations,
  deleteDonation,
  updateDonation,
} from "../controllers/donation.controller.js";

export default (router: express.Router) => {
  router.get("/donations", getDonations);
  router.post("/donations", createDonation);
  router.delete("/donations/:id", deleteDonation);
  router.put("/donations/:id", updateDonation);
};
