import express from "express";
import { paginateEvents, createEvent } from "../controllers/event.controller.js";

export default (router: express.Router) => {
  router.get("/events", paginateEvents);
  router.post("/events", createEvent);
};
