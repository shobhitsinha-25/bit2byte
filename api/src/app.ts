
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

// Routes
import authRoutes from "./modules/auth/auth.routes.js";
import topicRoutes from "./modules/topic/topic.routes.js";
import mentorRoutes from "./modules/mentor/mentor.routes.js";
import availabilityRoutes from "./modules/availability/availability.routes.js";
import discoveryRoutes from "./modules/mentor/discovery.routes.js";
import bookingRoutes from "./modules/booking/booking.routes.js";
import paymentRoutes from "./modules/payment/payment.routes.js";
import razorpayWebhookRoutes from "./modules/payment/payment.webhook.routes.js";
import mentorSessionRoutes from "./modules/booking/mentor-session.routes.js";

const app = express();

// =====================================
// MIDDLEWARE
// =====================================

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Razorpay webhook must receive the raw body.
// Keep this BEFORE express.json().
app.use(
  "/api/webhooks/razorpay",
  express.raw({ type: "application/json" }),
  razorpayWebhookRoutes
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// =====================================
// HEALTH CHECK
// =====================================

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Bit2Byte API is running",
  });
});

// =====================================
// API ROUTES
// =====================================

app.use("/api/auth", authRoutes);
app.use("/api/topics", topicRoutes);
app.use("/api/mentor", mentorRoutes);
app.use("/api/mentor/availability", availabilityRoutes);
app.use("/api/mentors", discoveryRoutes);
app.use("/api/student/bookings", bookingRoutes);
app.use("/api/student/payments", paymentRoutes);
app.use("/api/mentor/sessions", mentorSessionRoutes);

export default app;
