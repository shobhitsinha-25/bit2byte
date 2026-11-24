import { Router } from "express";
import * as discoveryController from "./discovery.controller.js";

const router = Router();

router.get("/", discoveryController.getMentors);
router.get("/:id/availability", discoveryController.getMentorAvailability);
router.get("/:id", discoveryController.getMentorById);


export default router;