import type { Request, Response } from "express";
import { ZodError } from "zod";

import { getMentorAvailabilityQuerySchema, getMentorsQuerySchema } from "./discovery.validation.js";
import * as discoveryService from "./discovery.service.js";
import { mentorIdSchema } from "./discovery.validation.js";

export const getMentors = async (
  req: Request,
  res: Response
) => {
  try {
    const query = getMentorsQuerySchema.parse(req.query);

    const result = await discoveryService.getMentors(query);

    return res.status(200).json({
      success: true,
      message: "Mentors fetched successfully",
      data: result,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: error.issues,
      });
    }

    console.error("Get mentors error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch mentors",
    });
  }
};

export const getMentorById = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = mentorIdSchema.parse(req.params);

    const mentor = await discoveryService.getMentorById(id);

    return res.status(200).json({
      success: true,
      message: "Mentor details fetched successfully",
      data: {
        mentor,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid mentor ID",
        errors: error.issues,
      });
    }

    if (
      error instanceof Error &&
      error.message === "MENTOR_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message: "Mentor not found",
      });
    }

    console.error("Get mentor details error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch mentor details",
    });
  }
};

export const getMentorAvailability = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = mentorIdSchema.parse(req.params);

    const query = getMentorAvailabilityQuerySchema.parse(
      req.query
    );

    const result = await discoveryService.getMentorAvailability(
      id,
      query
    );

    return res.status(200).json({
      success: true,
      message: "Mentor availability fetched successfully",
      data: result,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid request parameters",
        errors: error.issues,
      });
    }

    if (
      error instanceof Error &&
      error.message === "MENTOR_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message: "Mentor not found",
      });
    }

    console.error("Get mentor availability error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch mentor availability",
    });
  }
};