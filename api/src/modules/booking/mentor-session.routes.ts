import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware.js";
import * as bookingController from "./booking.controller.js";

const router = Router();

router.use(authenticate, authorize("MENTOR"));

router.get("/", bookingController.getMentorSessions);
router.get("/:id", bookingController.getMentorSessionById);
router.patch("/:id/complete", bookingController.completeMentorSession);

export default router;