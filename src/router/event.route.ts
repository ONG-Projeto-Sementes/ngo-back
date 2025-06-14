import express from "express";
import {
  paginateEvents,
  createEvent,
  updateEvent,
} from "../controllers/event.controller.js";

export default (router: express.Router) => {
  router.get("/events", paginateEvents);
  router.post("/events", createEvent);
  router.put("/events/:id", updateEvent);
};
