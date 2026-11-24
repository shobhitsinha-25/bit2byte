
import api from "../../../../services/api";

import type {
  AvailabilityListResponse,
  AvailabilityResponse,
  CreateAvailabilityPayload,
  UpdateAvailabilityPayload,
} from "../types/availability.types";

// =====================================
// GET ALL AVAILABILITY
// =====================================

export const getMentorAvailability =
  async (): Promise<AvailabilityListResponse> => {
    const response = await api.get<AvailabilityListResponse>(
      "/mentor/availability"
    );

    return response.data;
  };

// =====================================
// GET AVAILABILITY BY ID
// =====================================

export const getAvailabilityById = async (
  availabilityId: string
): Promise<AvailabilityResponse> => {
  const response = await api.get<AvailabilityResponse>(
    `/mentor/availability/${availabilityId}`
  );

  return response.data;
};

// =====================================
// CREATE AVAILABILITY
// =====================================

export const createAvailability = async (
  payload: CreateAvailabilityPayload
): Promise<AvailabilityResponse> => {
  const response = await api.post<AvailabilityResponse>(
    "/mentor/availability",
    payload
  );

  return response.data;
};

// =====================================
// UPDATE AVAILABILITY
// =====================================

export const updateAvailability = async (
  availabilityId: string,
  payload: UpdateAvailabilityPayload
): Promise<AvailabilityResponse> => {
  const response = await api.put<AvailabilityResponse>(
    `/mentor/availability/${availabilityId}`,
    payload
  );

  return response.data;
};

// =====================================
// CANCEL AVAILABILITY
// =====================================

export const cancelAvailability = async (
  availabilityId: string
): Promise<AvailabilityResponse> => {
  const response = await api.delete<AvailabilityResponse>(
    `/mentor/availability/${availabilityId}`
  );

  return response.data;
};
