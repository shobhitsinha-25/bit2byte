
import api from "../../../services/api";

export interface MentorExpertise {
  id: string;
  name: string;
  slug: string;
}

export interface Mentor {
  id: string;
  name: string;
  headline: string | null;
  bio: string | null;
  yearsOfExperience: number;
  isVerified: boolean;
  expertise: MentorExpertise[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface MentorListResponse {
  success: boolean;
  message: string;
  data: {
    mentors: Mentor[];
    pagination: Pagination;
  };
}

export interface MentorQueryParams {
  search?: string;
  topicId?: string;
  page?: number;
  limit?: number;
}

export const getMentors = async (
  params: MentorQueryParams = {}
): Promise<MentorListResponse> => {
  const response = await api.get<MentorListResponse>("/mentors", {
    params,
  });

  return response.data;
};

export interface Topic {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  level: "DOMAIN" | "CATEGORY" | "TOPIC";
  parentId: string | null;
  sortOrder: number;
  children: Topic[];
}

export interface TopicListResponse {
  success: boolean;
  message: string;
  data: {
    topics: Topic[];
  };
}

export const getTopics = async (): Promise<TopicListResponse> => {
  const response = await api.get<TopicListResponse>("/topics");
  return response.data;
};


export interface MentorDetails extends Mentor {
  createdAt: string;
  expertise: (MentorExpertise & {
    description: string | null;
  })[];
}

export interface MentorDetailsResponse {
  success: boolean;
  message: string;
  data: {
    mentor: MentorDetails;
  };
}

export interface MentorAvailability {
  id: string;
  topicId: string;
  startAt: string;
  endAt: string;
  sessionFee: string | number;
  currency: string;
  status: "AVAILABLE" | "BOOKED" | "CANCELLED";
  topic: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface MentorAvailabilityResponse {
  success: boolean;
  message: string;
  data: {
    availability: MentorAvailability[];
    pagination: Pagination;
  };
}

export interface AvailabilityQueryParams {
  topicId?: string;
  page?: number;
  limit?: number;
}

export const getMentorDetails = async (
  mentorId: string
): Promise<MentorDetailsResponse> => {
  const response = await api.get<MentorDetailsResponse>(
    `/mentors/${mentorId}`
  );

  return response.data;
};

export const getMentorAvailability = async (
  mentorId: string,
  params: AvailabilityQueryParams = {}
): Promise<MentorAvailabilityResponse> => {
  const response = await api.get<MentorAvailabilityResponse>(
    `/mentors/${mentorId}/availability`,
    { params }
  );

  return response.data;
};
