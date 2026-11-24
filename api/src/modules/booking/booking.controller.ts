import type { Request, Response } from "express";
import { ZodError } from "zod";

import { createBookingSchema } from "./booking.validation.js";
import * as bookingService from "./booking.service.js";

export const createBooking = async (
  req: Request,
  res: Response
) => {
  try {
    const data = createBookingSchema.parse(req.body);

    const booking = await bookingService.createBooking(
      req.user!.id,
      data
    );

    return res.status(201).json({
      success: true,
      message: "Booking created successfully. Complete payment within 15 minutes.",
      data: {
        booking,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking request",
        errors: error.issues,
      });
    }

    if (error instanceof Error) {
      const errors: Record<string, { status: number; message: string }> = {
        STUDENT_NOT_FOUND: {
          status: 404,
          message: "Student not found or inactive",
        },
        AVAILABILITY_NOT_FOUND: {
          status: 404,
          message: "Availability slot not found",
        },
        MENTOR_NOT_AVAILABLE: {
          status: 409,
          message: "This mentor is currently unavailable",
        },
        INVALID_TOPIC: {
          status: 400,
          message: "The session topic is no longer available",
        },
        SLOT_EXPIRED: {
          status: 409,
          message: "This session slot has already expired",
        },
        INVALID_SLOT_TIME: {
          status: 400,
          message: "Invalid session time",
        },
        SLOT_NOT_AVAILABLE: {
          status: 409,
          message: "This session slot is no longer available",
        },
        BOOKING_CONCURRENT_MODIFICATION: {
          status: 409,
          message: "Another booking operation is in progress. Please try again.",
        },
      };

      const knownError = errors[error.message];

      if (knownError) {
        return res.status(knownError.status).json({
          success: false,
          message: knownError.message,
        });
      }
    }

    console.error("Create booking error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create booking",
    });
  }
};


const allowedBookingStatuses = [
  "PENDING_PAYMENT",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
  "PAYMENT_FAILED",
] as const;

const getSessionFilters = (req: Request) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 10);

  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 50
  ) {
    throw new Error("INVALID_PAGINATION");
  }

  const rawStatus = req.query.status;

  if (rawStatus === undefined) {
    return { page, limit };
  }

  if (
    typeof rawStatus !== "string" ||
    !allowedBookingStatuses.includes(
      rawStatus as (typeof allowedBookingStatuses)[number]
    )
  ) {
    throw new Error("INVALID_BOOKING_STATUS");
  }

  return {
    page,
    limit,
    status: rawStatus as (typeof allowedBookingStatuses)[number],
  };
};

// =====================================
// STUDENT: GET MY SESSIONS
// =====================================

export const getStudentSessions = async (
  req: Request,
  res: Response
) => {
  try {
    const filters = getSessionFilters(req);

    const result = await bookingService.getStudentSessions(
      req.user!.id,
      filters
    );

    return res.status(200).json({
      success: true,
      message: "Student sessions fetched successfully",
      data: result,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      ["INVALID_PAGINATION", "INVALID_BOOKING_STATUS"].includes(
        error.message
      )
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Get student sessions error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch student sessions",
    });
  }
};

// =====================================
// MENTOR: GET MY SESSIONS
// =====================================

export const getMentorSessions = async (
  req: Request,
  res: Response
) => {
  try {
    const filters = getSessionFilters(req);

    const result = await bookingService.getMentorSessions(
      req.user!.id,
      filters
    );

    return res.status(200).json({
      success: true,
      message: "Mentor sessions fetched successfully",
      data: result,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      ["INVALID_PAGINATION", "INVALID_BOOKING_STATUS"].includes(
        error.message
      )
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Get mentor sessions error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch mentor sessions",
    });
  }
};

export const getStudentSessionById = async (
  req: Request,
  res: Response
) => {
  try {
    const booking = await bookingService.getStudentSessionById(
      req.user!.id,
      req.params.id as string
    );

    return res.status(200).json({
      success: true,
      data: { booking },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "INTERNAL_SERVER_ERROR";

    if (message === "BOOKING_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to fetch session",
    });
  }
};

export const getMentorSessionById = async (
  req: Request,
  res: Response
) => {
  try {
    const booking = await bookingService.getMentorSessionById(
      req.user!.id,
      req.params.id as string
    );

    return res.status(200).json({
      success: true,
      data: { booking },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "INTERNAL_SERVER_ERROR";

    if (message === "BOOKING_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to fetch session",
    });
  }
};

export const completeMentorSession = async (
  req: Request,
  res: Response
) => {
  try {
    const booking = await bookingService.completeMentorSession(
      req.user!.id,
      req.params.id as string
    );

    return res.status(200).json({
      success: true,
      message: "Session completed successfully",
      data: {
        booking,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "INTERNAL_SERVER_ERROR";

    const errorResponses: Record<
      string,
      { status: number; message: string }
    > = {
      BOOKING_NOT_FOUND: {
        status: 404,
        message: "Session not found",
      },
      BOOKING_NOT_CONFIRMED: {
        status: 400,
        message: "Only confirmed sessions can be completed",
      },
      SUCCESSFUL_PAYMENT_NOT_FOUND: {
        status: 400,
        message: "A successful payment is required",
      },
      SESSION_NOT_ENDED: {
        status: 400,
        message: "The session cannot be completed before its scheduled end time",
      },
      BOOKING_STATUS_CHANGED: {
        status: 409,
        message: "The booking status changed. Please refresh and try again",
      },
      PAYOUT_RECORD_MISSING: {
        status: 500,
        message: "Payout record is missing for this completed session",
      },
    };

    const knownError = errorResponses[message];

    if (knownError) {
      return res.status(knownError.status).json({
        success: false,
        message: knownError.message,
      });
    }

    console.error("Complete mentor session error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to complete session",
    });
  }
};