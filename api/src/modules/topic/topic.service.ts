
import prisma from "../../config/database.js";

type TopicRecord = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  level: "DOMAIN" | "CATEGORY" | "TOPIC";
  parentId: string | null;
  sortOrder: number;
};

type TopicNode = TopicRecord & {
  children: TopicNode[];
};

export const getTopics = async (): Promise<TopicNode[]> => {
  const topics = await prisma.topic.findMany({
    where: {
      isActive: true,
    },
    orderBy: [
      { sortOrder: "asc" },
      { name: "asc" },
    ],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      level: true,
      parentId: true,
      sortOrder: true,
    },
  });

  // Create a map containing every topic with an empty children array.
  const topicMap = new Map<string, TopicNode>();

  for (const topic of topics) {
    topicMap.set(topic.id, {
      ...topic,
      children: [],
    });
  }

  const hierarchy: TopicNode[] = [];

  // Build DOMAIN -> CATEGORY -> TOPIC hierarchy.
  for (const topic of topics) {
    const currentTopic = topicMap.get(topic.id)!;

    if (topic.parentId) {
      const parent = topicMap.get(topic.parentId);

      if (parent) {
        // Important: push the mapped object, not the original database record.
        parent.children.push(currentTopic);
      }
    } else {
      hierarchy.push(currentTopic);
    }
  }

  return hierarchy;
};
