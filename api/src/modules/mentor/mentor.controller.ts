
import type { Request, Response } from "express";

import * as mentorService from "./mentor.service.js";

import {
  updateExpertiseSchema,
} from "./mentor.validation.js";

// =====================================
// GET MENTOR EXPERTISE
// =====================================

export const getExpertise = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const expertise = await mentorService.getMentorExpertise(userId);

    return res.status(200).json({
      success: true,
      message: "Mentor expertise fetched successfully",
      data: { expertise },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "MENTOR_PROFILE_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message: "Mentor profile not found",
      });
    }

    console.error("Get mentor expertise error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch mentor expertise",
    });
  }
};

// =====================================
// UPDATE MENTOR EXPERTISE
// =====================================

export const updateExpertise = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const parsed = updateExpertiseSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten(),
      });
    }

    const expertise = await mentorService.updateMentorExpertise(
      userId,
      parsed.data
    );

    return res.status(200).json({
      success: true,
      message: "Mentor expertise updated successfully",
      data: { expertise },
    });
  } catch (error) {
    if (error instanceof Error) {
      switch (error.message) {
        case "MENTOR_PROFILE_NOT_FOUND":
          return res.status(404).json({
            success: false,
            message: "Mentor profile not found",
          });

        case "INVALID_TOPIC_SELECTION":
          return res.status(400).json({
            success: false,
            message: "One or more selected topics are invalid or inactive",
          });
      }
    }

    console.error("Update mentor expertise error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update mentor expertise",
    });
  }
};
