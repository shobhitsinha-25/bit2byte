
import api from "../../../../services/api";

import type {
  TopicsResponse,
  ExpertiseResponse,
  UpdateExpertisePayload,
  UpdateExpertiseResponse,
} from "../types/mentor.types";

// Fetch complete Computer Science topic hierarchy
export const getTopics = async (): Promise<TopicsResponse> => {
  const response = await api.get<TopicsResponse>("/topics");
  return response.data;
};

// Fetch currently selected mentor expertise
export const getMentorExpertise = async (): Promise<ExpertiseResponse> => {
  const response = await api.get<ExpertiseResponse>(
    "/mentor/expertise"
  );

  return response.data;
};

// Save selected mentor expertise
export const updateMentorExpertise = async (
  payload: UpdateExpertisePayload
): Promise<UpdateExpertiseResponse> => {
  const response = await api.put<UpdateExpertiseResponse>(
    "/mentor/expertise",
    payload
  );

  return response.data;
};
