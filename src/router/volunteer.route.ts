import express from "express";
import { createVolunteer, getVolunteers } from "../controllers/volunteer.controller.js";

export default (router: express.Router) => {
  router.get("/volunteers", getVolunteers);
  router.post("/volunteers", createVolunteer);
};
