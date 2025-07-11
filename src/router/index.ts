import express from "express";

import users from "./users.route.js";
import authentication from "./authentication.route.js";
import { isAuthenticated } from "../middlewares/isAuthenticated.js";
import volunteerRoute from "./volunteer.route.js";
import familyRoute from "./family.route.js";
import eventRoute from "./event.route.js";
import donationRoute from "./donation.route.js";
import donationCategoryRoute from "./donation-category.route.js";
import donationDistributionRoute from "./donation-distribution.route.js";
import beneficiaryRoute from "./beneficiary.route.js";
import analyticsRoute from "./analytics.route.js";

const router = express.Router();

export default (): express.Router => {
  // Public routes (no authentication required)
  authentication(router);
  
  // Public events route for homepage
  router.get("/events/last", async (req, res) => {
    try {
      const { getLastEvents } = await import("../controllers/event.controller.js");
      await getLastEvents[0](req, res, () => {});
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Apply authentication middleware to all subsequent routes
  router.use(isAuthenticated);

  // Protected routes
  users(router);
  eventRoute(router);
  familyRoute(router);
  donationRoute(router);
  donationCategoryRoute(router);
  donationDistributionRoute(router);
  volunteerRoute(router);
  beneficiaryRoute(router);
  analyticsRoute(router);

  return router;
};
