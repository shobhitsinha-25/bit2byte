
import prisma from "../../config/database.js";
import type { UpdateExpertiseInput } from "./mentor.validation.js";

// =====================================
// GET MENTOR EXPERTISE
// =====================================

export const getMentorExpertise = async (userId: string) => {
  const mentorProfile = await prisma.mentorProfile.findUnique({
    where: {
      userId,
    },
    select: {
      id: true,
      expertise: {
        orderBy: {
          topic: {
            name: "asc",
          },
        },
        select: {
          id: true,
          topic: {
            select: {
              id: true,
              name: true,
              slug: true,
              level: true,
              parent: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  parent: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!mentorProfile) {
    throw new Error("MENTOR_PROFILE_NOT_FOUND");
  }

  return mentorProfile.expertise.map((item) => item.topic);
};

// =====================================
// UPDATE MENTOR EXPERTISE
// =====================================

export const updateMentorExpertise = async (
  userId: string,
  data: UpdateExpertiseInput
) => {
  const mentorProfile = await prisma.mentorProfile.findUnique({
    where: {
      userId,
    },
    select: {
      id: true,
    },
  });

  if (!mentorProfile) {
    throw new Error("MENTOR_PROFILE_NOT_FOUND");
  }

  const { topicIds } = data;

  // Validate that every selected ID is an active leaf topic.
  const validTopics = await prisma.topic.findMany({
    where: {
      id: {
        in: topicIds,
      },
      level: "TOPIC",
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  if (validTopics.length !== topicIds.length) {
    throw new Error("INVALID_TOPIC_SELECTION");
  }

  // Replace expertise atomically.
  await prisma.$transaction(async (tx) => {
    await tx.mentorExpertise.deleteMany({
      where: {
        mentorProfileId: mentorProfile.id,
      },
    });

    if (topicIds.length > 0) {
      await tx.mentorExpertise.createMany({
        data: topicIds.map((topicId) => ({
          mentorProfileId: mentorProfile.id,
          topicId,
        })),
      });
    }
  });

  return getMentorExpertise(userId);
};
