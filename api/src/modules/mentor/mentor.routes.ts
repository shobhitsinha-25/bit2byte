
import { Router } from "express";

import * as mentorController from "./mentor.controller.js";

import {
  authenticate,
  authorize,
} from "../auth/auth.middleware.js";

const router = Router();

router.use(authenticate, authorize("MENTOR"));

router.get(
  "/expertise",
  mentorController.getExpertise
);

router.put(
  "/expertise",
  mentorController.updateExpertise
);

export default router;
