import { Router } from "express";

import * as authController from "./auth.controller.js";
import { authenticate } from "./auth.middleware.js";
import { authRateLimiter } from "./auth.rate-limit.js";

const router = Router();

router.post("/register", authRateLimiter, authController.register);
router.post("/login", authRateLimiter, authController.login);
router.post("/refresh", authRateLimiter, authController.refresh);
router.post("/logout", authController.logout);

router.get("/me", authenticate, authController.me);
router.post("/google", authController.googleAuth);

export default router;