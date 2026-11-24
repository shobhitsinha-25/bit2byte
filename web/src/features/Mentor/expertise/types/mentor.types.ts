
export type TopicLevel = "DOMAIN" | "CATEGORY" | "TOPIC";

export interface Topic {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  level: TopicLevel;
  parentId: string | null;
  sortOrder: number;
  children: Topic[];
}

export interface ExpertiseTopic {
  id: string;
  name: string;
  slug: string;
  level: TopicLevel;
}

export interface TopicsResponse {
  success: boolean;
  message: string;
  data: {
    topics: Topic[];
  };
}

export interface ExpertiseResponse {
  success: boolean;
  message: string;
  data: {
    expertise: ExpertiseTopic[];
  };
}

export interface UpdateExpertiseResponse {
  success: boolean;
  message: string;
  data: {
    expertise: ExpertiseTopic[];
  };
}

export interface UpdateExpertisePayload {
  topicIds: string[];
}
