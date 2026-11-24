import { Prisma } from "../../generated/prisma/client.js";
import prisma from "../../config/database.js";

import type { GetMentorAvailabilityQuery, GetMentorsQuery } from "./discovery.validation.js";

export const getMentors = async (query: GetMentorsQuery) => {
  const { search, topicId, page, limit } = query;

  const where: Prisma.MentorProfileWhereInput = {
    isVerified: true,

    user: {
      is: {
        isActive: true,
      },
    },

    expertise: {
      some: {
        topic: {
          is: {
            isActive: true,
            level: "TOPIC",
          },
        },
      },
    },
  };

  // Search by mentor name or headline.
  if (search) {
    where.OR = [
      {
        headline: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        user: {
          is: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      },
    ];
  }

  // Filter by selected expertise topic.
  if (topicId) {
    where.expertise = {
      some: {
        topicId,
        topic: {
          is: {
            isActive: true,
            level: "TOPIC",
          },
        },
      },
    };
  }

  const skip = (page - 1) * limit;

  const [mentors, total] = await Promise.all([
    prisma.mentorProfile.findMany({
      where,
      skip,
      take: limit,

      orderBy: [
        {
          createdAt: "desc",
        },
        {
          id: "asc",
        },
      ],

      select: {
        id: true,
        headline: true,
        bio: true,
        yearsOfExperience: true,
        isVerified: true,

        user: {
          select: {
            name: true,
          },
        },

        expertise: {
          where: {
            topic: {
              is: {
                isActive: true,
                level: "TOPIC",
              },
            },
          },
          select: {
            topic: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    }),

    prisma.mentorProfile.count({
      where,
    }),
  ]);

  return {
    mentors: mentors.map((mentor) => ({
      id: mentor.id,
      name: mentor.user.name,
      headline: mentor.headline,
      bio: mentor.bio,
      yearsOfExperience: mentor.yearsOfExperience,
      isVerified: mentor.isVerified,

      expertise: mentor.expertise.map(
        (item) => item.topic
      ),
    })),

    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
  };
};

export const getMentorById = async (mentorId: string) => {
  const mentor = await prisma.mentorProfile.findFirst({
    where: {
      id: mentorId,
      isVerified: true,

      user: {
        is: {
          isActive: true,
        },
      },
    },

    select: {
      id: true,
      headline: true,
      bio: true,
      yearsOfExperience: true,
      isVerified: true,

      createdAt: true,

      user: {
        select: {
          name: true,
        },
      },

      expertise: {
        where: {
          topic: {
            is: {
              isActive: true,
              level: "TOPIC",
            },
          },
        },

        select: {
          topic: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
            },
          },
        },
      },
    },
  });

  if (!mentor) {
    throw new Error("MENTOR_NOT_FOUND");
  }

  return {
    id: mentor.id,
    name: mentor.user.name,
    headline: mentor.headline,
    bio: mentor.bio,
    yearsOfExperience: mentor.yearsOfExperience,
    isVerified: mentor.isVerified,
    createdAt: mentor.createdAt,

    expertise: mentor.expertise.map(
      (item) => item.topic
    ),
  };
};

export const getMentorAvailability = async (
  mentorId: string,
  query: GetMentorAvailabilityQuery
) => {
  const { topicId, page, limit } = query;

  const now = new Date();

  // Verify that the mentor exists and is discoverable.
  const mentor = await prisma.mentorProfile.findFirst({
    where: {
      id: mentorId,
      isVerified: true,
      user: {
        is: {
          isActive: true,
        },
      },
    },
    select: {
      id: true,
    },
  });

  if (!mentor) {
    throw new Error("MENTOR_NOT_FOUND");
  }

  const where: Prisma.AvailabilityWhereInput = {
    mentorProfileId: mentor.id,
    status: "AVAILABLE",
    startAt: {
      gt: now,
    },
    topic: {
      is: {
        isActive: true,
        level: "TOPIC",
      },
    },
  };

  if (topicId) {
    where.topicId = topicId;
  }

  const skip = (page - 1) * limit;

  const [availability, total] = await prisma.$transaction([
    prisma.availability.findMany({
      where,
      skip,
      take: limit,

      orderBy: [
        { startAt: "asc" },
        { id: "asc" },
      ],

      select: {
        id: true,
        topicId: true,
        startAt: true,
        endAt: true,
        sessionFee: true,
        currency: true,
        status: true,

        topic: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    }),

    prisma.availability.count({
      where,
    }),
  ]);

  return {
    availability,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
  };
};