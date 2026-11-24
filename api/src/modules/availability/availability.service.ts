
import { Prisma } from "../../generated/prisma/client.js";
import prisma from "../../config/database.js";

import type {
  CreateAvailabilityInput,
  UpdateAvailabilityInput,
} from "./availability.validation.js";

// =====================================
// HELPER: GET VERIFIED MENTOR PROFILE
// =====================================

const getVerifiedMentor = async (userId: string) => {
  const mentorProfile = await prisma.mentorProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      isVerified: true,
    },
  });

  if (!mentorProfile) {
    throw new Error("MENTOR_PROFILE_NOT_FOUND");
  }

  if (!mentorProfile.isVerified) {
    throw new Error("MENTOR_NOT_VERIFIED");
  }

  return mentorProfile;
};

// =====================================
// HELPER: VALIDATE TOPIC EXPERTISE
// =====================================

const validateMentorTopic = async (
  mentorProfileId: string,
  topicId: string
) => {
  const topic = await prisma.topic.findFirst({
    where: {
      id: topicId,
      level: "TOPIC",
      isActive: true,
      mentorExpertise: {
        some: {
          mentorProfileId,
        },
      },
    },
    select: {
      id: true,
    },
  });

  if (!topic) {
    throw new Error("INVALID_TOPIC_OR_EXPERTISE");
  }
};

// =====================================
// HELPER: VALIDATE FUTURE TIME
// =====================================

const validateFutureSlot = (startAt: Date, endAt: Date) => {
  if (startAt.getTime() <= Date.now()) {
    throw new Error("SLOT_MUST_BE_IN_FUTURE");
  }

  if (endAt.getTime() <= startAt.getTime()) {
    throw new Error("INVALID_SLOT_TIME");
  }
};

// =====================================
// HELPER: CHECK OVERLAPPING SLOTS
// =====================================

const checkSlotOverlap = async (
  tx: Prisma.TransactionClient,
  mentorProfileId: string,
  startAt: Date,
  endAt: Date,
  excludeSlotId?: string
) => {
  const overlappingSlot = await tx.availability.findFirst({
    where: {
      mentorProfileId,

      status: {
        in: ["AVAILABLE", "BOOKED"],
      },

      startAt: {
        lt: endAt,
      },

      endAt: {
        gt: startAt,
      },

      ...(excludeSlotId && {
        id: {
          not: excludeSlotId,
        },
      }),
    },
    select: {
      id: true,
    },
  });

  if (overlappingSlot) {
    throw new Error("AVAILABILITY_SLOT_OVERLAP");
  }
};

// =====================================
// CREATE AVAILABILITY
// =====================================

export const createAvailability = async (
  userId: string,
  data: CreateAvailabilityInput
) => {
  const mentorProfile = await getVerifiedMentor(userId);

  const startAt = new Date(data.startAt);
  const endAt = new Date(data.endAt);

  validateFutureSlot(startAt, endAt);

  await validateMentorTopic(mentorProfile.id, data.topicId);

  try {
    return await prisma.$transaction(
      async (tx) => {
        await checkSlotOverlap(
          tx,
          mentorProfile.id,
          startAt,
          endAt
        );

        return tx.availability.create({
          data: {
            mentorProfileId: mentorProfile.id,
            topicId: data.topicId,
            startAt,
            endAt,
            sessionFee: new Prisma.Decimal(data.sessionFee),
          },
          include: {
            topic: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      throw new Error("AVAILABILITY_CONCURRENT_MODIFICATION");
    }

    throw error;
  }
};

// =====================================
// GET ALL MENTOR AVAILABILITY
// =====================================


export const getMentorAvailability = async (userId: string) => {
  const mentorProfile = await prisma.mentorProfile.findUnique({
    where: { userId },
    select: {
      id: true,
    },
  });

  if (!mentorProfile) {
    throw new Error("MENTOR_PROFILE_NOT_FOUND");
  }

  return prisma.availability.findMany({
    where: {
      mentorProfileId: mentorProfile.id,

      // Hide cancelled slots from the default availability list
      status: {
        in: ["AVAILABLE", "BOOKED"],
      },
    },
    include: {
      topic: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    orderBy: {
      startAt: "asc",
    },
  });
};


// =====================================
// GET AVAILABILITY BY ID
// =====================================

export const getAvailabilityById = async (
  userId: string,
  availabilityId: string
) => {
  const mentorProfile = await prisma.mentorProfile.findUnique({
    where: { userId },
    select: {
      id: true,
    },
  });

  if (!mentorProfile) {
    throw new Error("MENTOR_PROFILE_NOT_FOUND");
  }

  const availability = await prisma.availability.findFirst({
    where: {
      id: availabilityId,
      mentorProfileId: mentorProfile.id,
    },
    include: {
      topic: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  if (!availability) {
    throw new Error("AVAILABILITY_NOT_FOUND");
  }

  return availability;
};

// =====================================
// UPDATE AVAILABILITY
// =====================================

export const updateAvailability = async (
  userId: string,
  availabilityId: string,
  data: UpdateAvailabilityInput
) => {
  const mentorProfile = await getVerifiedMentor(userId);

  const existingSlot = await prisma.availability.findFirst({
    where: {
      id: availabilityId,
      mentorProfileId: mentorProfile.id,
    },
  });

  if (!existingSlot) {
    throw new Error("AVAILABILITY_NOT_FOUND");
  }

  if (existingSlot.status !== "AVAILABLE") {
    throw new Error("ONLY_AVAILABLE_SLOTS_CAN_BE_UPDATED");
  }

  const startAt = data.startAt
    ? new Date(data.startAt)
    : existingSlot.startAt;

  const endAt = data.endAt
    ? new Date(data.endAt)
    : existingSlot.endAt;

  const topicId = data.topicId ?? existingSlot.topicId;

  validateFutureSlot(startAt, endAt);

  if (data.topicId) {
    await validateMentorTopic(mentorProfile.id, topicId);
  }

  try {
    return await prisma.$transaction(
      async (tx) => {
        // Recheck ownership and status inside the transaction.
        const currentSlot = await tx.availability.findFirst({
          where: {
            id: availabilityId,
            mentorProfileId: mentorProfile.id,
          },
        });

        if (!currentSlot) {
          throw new Error("AVAILABILITY_NOT_FOUND");
        }

        if (currentSlot.status !== "AVAILABLE") {
          throw new Error("ONLY_AVAILABLE_SLOTS_CAN_BE_UPDATED");
        }

        await checkSlotOverlap(
          tx,
          mentorProfile.id,
          startAt,
          endAt,
          availabilityId
        );

        return tx.availability.update({
          where: {
            id: availabilityId,
          },
          data: {
            topicId,
            startAt,
            endAt,
            ...(data.sessionFee !== undefined && {
              sessionFee: new Prisma.Decimal(data.sessionFee),
            }),
          },
          include: {
            topic: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      throw new Error("AVAILABILITY_CONCURRENT_MODIFICATION");
    }

    throw error;
  }
};

// =====================================
// CANCEL AVAILABILITY
// =====================================

export const cancelAvailability = async (
  userId: string,
  availabilityId: string
) => {
  const mentorProfile = await prisma.mentorProfile.findUnique({
    where: { userId },
    select: {
      id: true,
    },
  });

  if (!mentorProfile) {
    throw new Error("MENTOR_PROFILE_NOT_FOUND");
  }

  return prisma.$transaction(async (tx) => {
    const availability = await tx.availability.findFirst({
      where: {
        id: availabilityId,
        mentorProfileId: mentorProfile.id,
      },
    });

    if (!availability) {
      throw new Error("AVAILABILITY_NOT_FOUND");
    }

    if (availability.status === "BOOKED") {
      throw new Error("BOOKED_SLOT_REQUIRES_REFUND_FLOW");
    }

    if (availability.status === "CANCELLED") {
      throw new Error("AVAILABILITY_ALREADY_CANCELLED");
    }

    return tx.availability.update({
      where: {
        id: availabilityId,
      },
      data: {
        status: "CANCELLED",
      },
      include: {
        topic: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  });
};
