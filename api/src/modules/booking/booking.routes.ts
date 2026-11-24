import { Router } from "express";

import { authenticate, authorize } from "../auth/auth.middleware.js";
import * as bookingController from "./booking.controller.js";

const router = Router();

router.use(authenticate, authorize("STUDENT"));
router.get("/", bookingController.getStudentSessions);
router.get("/:id", bookingController.getStudentSessionById);

router.post("/", bookingController.createBooking);



export default router;