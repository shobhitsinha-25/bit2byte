
import type { Request, Response } from "express";

import * as availabilityService from "./availability.service.js";

import {
  createAvailabilitySchema,
  updateAvailabilitySchema,
} from "./availability.validation.js";

// =====================================
// ERROR HANDLER
// =====================================

const handleAvailabilityError = (
  error: unknown,
  res: Response
) => {
  const message =
    error instanceof Error ? error.message : "INTERNAL_SERVER_ERROR";

  const errorResponses: Record<
    string,
    { status: number; message: string }
  > = {
    MENTOR_PROFILE_NOT_FOUND: {
      status: 404,
      message: "Mentor profile not found",
    },

    MENTOR_NOT_VERIFIED: {
      status: 403,
      message: "Your mentor profile must be verified before managing availability",
    },

    INVALID_TOPIC_OR_EXPERTISE: {
      status: 400,
      message: "Selected topic is invalid or not part of your expertise",
    },

    SLOT_MUST_BE_IN_FUTURE: {
      status: 400,
      message: "Availability must be scheduled for a future date and time",
    },

    INVALID_SLOT_TIME: {
      status: 400,
      message: "End time must be later than start time",
    },

    AVAILABILITY_SLOT_OVERLAP: {
      status: 409,
      message: "This availability overlaps with another existing session",
    },

    AVAILABILITY_CONCURRENT_MODIFICATION: {
      status: 409,
      message: "Availability was modified concurrently. Please try again",
    },

    AVAILABILITY_NOT_FOUND: {
      status: 404,
      message: "Availability slot not found",
    },

    ONLY_AVAILABLE_SLOTS_CAN_BE_UPDATED: {
      status: 409,
      message: "Only available slots can be updated",
    },

    BOOKED_SLOT_REQUIRES_REFUND_FLOW: {
      status: 409,
      message: "This session is already booked. Use the booking cancellation process to initiate a refund",
    },

    AVAILABILITY_ALREADY_CANCELLED: {
      status: 409,
      message: "This availability slot is already cancelled",
    },
  };

  const response = errorResponses[message];

  if (response) {
    return res.status(response.status).json({
      success: false,
      message: response.message,
    });
  }

  console.error("Availability controller error:", error);

  return res.status(500).json({
    success: false,
    message: "Something went wrong while managing availability",
  });
};

// =====================================
// CREATE AVAILABILITY
// POST /api/mentor/availability
// =====================================

export const createAvailability = async (
  req: Request,
  res: Response
) => {
  try {
    const validation = createAvailabilitySchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid availability details",
        errors: validation.error.flatten(),
      });
    }

    const userId = req.user!.id;

    const availability =
      await availabilityService.createAvailability(
        userId,
        validation.data
      );

    return res.status(201).json({
      success: true,
      message: "Availability created successfully",
      data: {
        availability,
      },
    });
  } catch (error) {
    return handleAvailabilityError(error, res);
  }
};

// =====================================
// GET ALL MENTOR AVAILABILITY
// GET /api/mentor/availability
// =====================================

export const getMentorAvailability = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user!.id;

    const availability =
      await availabilityService.getMentorAvailability(userId);

    return res.status(200).json({
      success: true,
      message: "Availability fetched successfully",
      data: {
        availability,
      },
    });
  } catch (error) {
    return handleAvailabilityError(error, res);
  }
};

// =====================================
// GET AVAILABILITY BY ID
// GET /api/mentor/availability/:id
// =====================================

export const getAvailabilityById = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user!.id;
    const availabilityId = req.params.id;
    

if (typeof availabilityId !== "string") {
  return res.status(400).json({
    success: false,
    message: "Invalid availability ID",
  });
}

    if (!availabilityId) {
      return res.status(400).json({
        success: false,
        message: "Availability ID is required",
      });
    }

    const availability =
      await availabilityService.getAvailabilityById(
        userId,
        availabilityId
      );

    return res.status(200).json({
      success: true,
      message: "Availability fetched successfully",
      data: {
        availability,
      },
    });
  } catch (error) {
    return handleAvailabilityError(error, res);
  }
};

// =====================================
// UPDATE AVAILABILITY
// PUT /api/mentor/availability/:id
// =====================================

export const updateAvailability = async (
  req: Request,
  res: Response
) => {
  try {
    const validation = updateAvailabilitySchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid availability details",
        errors: validation.error.flatten(),
      });
    }

    const userId = req.user!.id;
const availabilityId = req.params.id;

if (typeof availabilityId !== "string" || !availabilityId) {
  return res.status(400).json({
    success: false,
    message: "Invalid availability ID",
  });
}
    const availability =
      await availabilityService.updateAvailability(
        userId,
        availabilityId,
        validation.data
      );

    return res.status(200).json({
      success: true,
      message: "Availability updated successfully",
      data: {
        availability,
      },
    });
  } catch (error) {
    return handleAvailabilityError(error, res);
  }
};

// =====================================
// CANCEL AVAILABILITY
// DELETE /api/mentor/availability/:id
// =====================================

export const cancelAvailability = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user!.id;
const availabilityId = req.params.id;

if (typeof availabilityId !== "string" || !availabilityId) {
  return res.status(400).json({
    success: false,
    message: "Invalid availability ID",
  });
}

    const availability =
      await availabilityService.cancelAvailability(
        userId,
        availabilityId
      );

    return res.status(200).json({
      success: true,
      message: "Availability cancelled successfully",
      data: {
        availability,
      },
    });
  } catch (error) {
    return handleAvailabilityError(error, res);
  }
};
