import express from "express";
import {
  getEvents,
  getLastEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  addVolunteerToEvent,
  removeVolunteerFromEvent,
} from "../controllers/event.controller.js";

export default (router: express.Router) => {
  router.get("/events/last", getLastEvents);
  router.get("/events", getEvents);
  router.get("/events/:id", getEvent);
  router.post("/events", createEvent);
  router.put("/events/:id", updateEvent);
  router.delete("/events/:id", deleteEvent);
  router.post("/events/:id/volunteers", addVolunteerToEvent);
  router.delete("/events/:id/volunteers/:volunteerId", removeVolunteerFromEvent);
};
