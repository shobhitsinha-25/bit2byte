
export type AvailabilityStatus =
  | "AVAILABLE"
  | "BOOKED"
  | "CANCELLED";

export interface AvailabilityTopic {
  id: string;
  name: string;
  slug: string;
}

export interface Availability {
  id: string;
  mentorProfileId: string;
  topicId: string;

  startAt: string;
  endAt: string;

  // Prisma Decimal is serialized as a string in JSON.
  sessionFee: string;

  currency: string;
  status: AvailabilityStatus;

  topic: AvailabilityTopic;

  createdAt: string;
  updatedAt: string;
}

export interface CreateAvailabilityPayload {
  topicId: string;
  startAt: string;
  endAt: string;
  sessionFee: number;
}

export interface UpdateAvailabilityPayload {
  topicId?: string;
  startAt?: string;
  endAt?: string;
  sessionFee?: number;
}

export interface AvailabilityResponse {
  success: boolean;
  message: string;
  data: {
    availability: Availability;
  };
}

export interface AvailabilityListResponse {
  success: boolean;
  message: string;
  data: {
    availability: Availability[];
  };
}
