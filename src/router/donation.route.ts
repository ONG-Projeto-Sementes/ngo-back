import express from "express";
import {createDonation, getDonations} from "../controllers/donation.controller.js";

export default (router: express.Router) => {
    router.get("/donations", getDonations);
    router.post("/donations", createDonation);
};
