import express from "express";
import {
  getVolunteers,
  createVolunteer,
  deleteVolunteer,
  updateVolunteer,
  getVolunteer,
} from "../controllers/volunteer.controller.js";

export default (router: express.Router) => {
  router.get("/volunteers", getVolunteers);
  router.get("/volunteers/:id", getVolunteer);
  router.post("/volunteers", createVolunteer);
  router.delete("/volunteers/:id", deleteVolunteer);
  router.put("/volunteers/:id", ...updateVolunteer);
};
