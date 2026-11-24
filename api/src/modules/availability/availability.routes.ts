
import { Router } from "express";

import * as availabilityController from "./availability.controller.js";
import {
  authenticate,
  authorize,
} from "../auth/auth.middleware.js";

const router = Router();

// All availability routes require an authenticated mentor.
router.use(authenticate, authorize("MENTOR"));

// Create a new availability slot
router.post(
  "/",
  availabilityController.createAvailability
);

// Get all availability slots of the logged-in mentor
router.get(
  "/",
  availabilityController.getMentorAvailability
);

// Get a particular availability slot
router.get(
  "/:id",
  availabilityController.getAvailabilityById
);

// Update an availability slot
router.put(
  "/:id",
  availabilityController.updateAvailability
);

// Cancel an availability slot
router.delete(
  "/:id",
  availabilityController.cancelAvailability
);

export default router;
