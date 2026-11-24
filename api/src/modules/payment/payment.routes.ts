
import { Router } from "express";

import {
  authenticate,
  authorize,
} from "../auth/auth.middleware.js";

import * as paymentController from "./payment.controller.js";

const router = Router();

router.use(authenticate, authorize("STUDENT"));

router.post(
  "/create-order",
  paymentController.createPaymentOrder
);

router.post(
  "/verify",
  paymentController.verifyPayment
);

export default router;
