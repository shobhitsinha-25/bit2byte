
import { Router } from "express";
import * as topicController from "./topic.controller.js";

const router = Router();

router.get("/", topicController.getTopics);

export default router;
