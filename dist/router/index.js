import express from "express";
import users from "./users.route.js";
import authentication from "./authentication.route.js";
import { isAuthenticated } from "../middlewares/isAuthenticated.js";
import volunteerRoute from "./volunteer.route.js";
import familyRoute from "./family.route.js";
import eventRoute from "./event.route.js";
import donationRoute from "./donation.route.js";
const router = express.Router();
export default () => {
    authentication(router);
    router.use(isAuthenticated);
    // Protected routes
    users(router);
    eventRoute(router);
    familyRoute(router);
    donationRoute(router);
    volunteerRoute(router);
    return router;
};
