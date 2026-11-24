
import type { Request, Response } from "express";
import * as topicService from "./topic.service.js";

export const getTopics = async (
  _req: Request,
  res: Response
) => {
  try {
    const topics = await topicService.getTopics();

    return res.status(200).json({
      success: true,
      message: "Topics fetched successfully",
      data: { topics },
    });
  } catch (error) {
    console.error("Get topics error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch topics",
    });
  }
};
