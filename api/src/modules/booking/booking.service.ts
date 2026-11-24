import { Prisma } from "../../generated/prisma/client.js";
import prisma from "../../config/database.js";

import type { CreateBookingInput } from "./booking.validation.js";

const PAYMENT_EXPIRY_MINUTES = 15;

export const createBooking = async (
  studentId: string,
  data: CreateBookingInput
) => {
  try {
    return await prisma.$transaction(
      async (tx) => {
        // 1. Verify that the student exists and is active.
        const student = await tx.user.findFirst({
          where: {
            id: studentId,
            role: "STUDENT",
            isActive: true,
          },
          select: {
            id: true,
          },
        });

        if (!student) {
          throw new Error("STUDENT_NOT_FOUND");
        }

        // 2. Find the requested availability.
        const availability = await tx.availability.findUnique({
          where: {
            id: data.availabilityId,
          },
          include: {
            mentorProfile: {
              include: {
                user: {
                  select: {
                    isActive: true,
                  },
                },
              },
            },
            topic: {
              select: {
                id: true,
                isActive: true,
                level: true,
              },
            },
          },
        });

        if (!availability) {
          throw new Error("AVAILABILITY_NOT_FOUND");
        }

        // 3. Validate mentor and topic.
        if (
          !availability.mentorProfile.isVerified ||
          !availability.mentorProfile.user.isActive
        ) {
          throw new Error("MENTOR_NOT_AVAILABLE");
        }

        if (
          !availability.topic.isActive ||
          availability.topic.level !== "TOPIC"
        ) {
          throw new Error("INVALID_TOPIC");
        }

        // 4. Validate slot time.
        const now = new Date();

        if (availability.startAt <= now) {
          throw new Error("SLOT_EXPIRED");
        }

        if (availability.endAt <= availability.startAt) {
          throw new Error("INVALID_SLOT_TIME");
        }

        // 5. Atomically reserve the slot.
        const reserved = await tx.availability.updateMany({
          where: {
            id: availability.id,
            status: "AVAILABLE",
            startAt: {
              gt: now,
            },
          },
          data: {
            status: "BOOKED",
          },
        });

        if (reserved.count !== 1) {
          throw new Error("SLOT_NOT_AVAILABLE");
        }

        // 6. Calculate payment expiry.
        const expiresAt = new Date(
          now.getTime() + PAYMENT_EXPIRY_MINUTES * 60 * 1000
        );

        // 7. Create the booking with price snapshot.
        const booking = await tx.booking.create({
          data: {
            studentId: student.id,
            availabilityId: availability.id,
            amount: availability.sessionFee,
            currency: availability.currency,
            status: "PENDING_PAYMENT",
            expiresAt,
          },

          include: {
            availability: {
              select: {
                id: true,
                startAt: true,
                endAt: true,
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
        });

        return booking;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 10000,
        timeout: 15000,
      }
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2034") {
        throw new Error("BOOKING_CONCURRENT_MODIFICATION");
      }

      if (error.code === "P2028") {
        console.error("Prisma transaction timeout:", error);

        throw new Error("BOOKING_TRANSACTION_TIMEOUT");
      }
    }

    throw error;
  }
};

type BookingStatusFilter =
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED"
  | "PAYMENT_FAILED";

interface SessionListFilters {
  page: number;
  limit: number;
  status?: BookingStatusFilter;
}

// =====================================
// STUDENT: GET MY SESSIONS
// =====================================

export const getStudentSessions = async (
  studentId: string,
  filters: SessionListFilters
) => {
  const { page, limit, status } = filters;
  const skip = (page - 1) * limit;

  const where: Prisma.BookingWhereInput = {
    studentId,
    ...(status ? { status } : {}),
  };

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        availability: {
          select: {
            id: true,
            startAt: true,
            endAt: true,
            topic: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            mentorProfile: {
              select: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        payments: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          select: {
            id: true,
            status: true,
            amount: true,
            currency: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    }),

    prisma.booking.count({ where }),
  ]);

  return {
    bookings,
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

// =====================================
// MENTOR: GET MY SESSIONS
// =====================================

export const getMentorSessions = async (
  mentorUserId: string,
  filters: SessionListFilters
) => {
  const { page, limit, status } = filters;
  const skip = (page - 1) * limit;

  const where: Prisma.BookingWhereInput = {
    availability: {
      mentorProfile: {
        userId: mentorUserId,
      },
    },
    ...(status ? { status } : {}),
  };

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        availability: {
          select: {
            id: true,
            startAt: true,
            endAt: true,
            topic: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        payments: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          select: {
            id: true,
            status: true,
            amount: true,
            currency: true,
          },
        },
        mentorPayout: {
          select: {
            amount: true,
            currency: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    }),

    prisma.booking.count({ where }),
  ]);

  return {
    bookings,
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

export const getStudentSessionById = async (
  studentId: string,
  bookingId: string
) => {
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      studentId,
    },
    include: {
      availability: {
        include: {
          topic: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
            },
          },
          mentorProfile: {
            select: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
      payments: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          provider: true,
          providerOrderId: true,
          providerPaymentId: true,
          amount: true,
          currency: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });

  if (!booking) {
    throw new Error("BOOKING_NOT_FOUND");
  }

  return booking;
};

export const getMentorSessionById = async (
  mentorUserId: string,
  bookingId: string
) => {
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      availability: {
        mentorProfile: {
          userId: mentorUserId,
        },
      },
    },
    include: {
      availability: {
        include: {
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
      student: {
        select: {
          id: true,
          name: true,
        },
      },
      payments: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          amount: true,
          currency: true,
          status: true,
          createdAt: true,
        },
      },
      mentorPayout: {
        select: {
          id: true,
          amount: true,
          currency: true,
          status: true,
          paidAt: true,
        },
      },
    },
  });

  if (!booking) {
    throw new Error("BOOKING_NOT_FOUND");
  }

  return booking;
};

export const completeMentorSession = async (
  mentorUserId: string,
  bookingId: string
) => {
  return prisma.$transaction(
    async (tx) => {
      const booking = await tx.booking.findFirst({
        where: {
          id: bookingId,
          availability: {
            mentorProfile: {
              userId: mentorUserId,
            },
          },
        },
        include: {
          availability: {
            include: {
              mentorProfile: true,
            },
          },
          payments: {
            where: {
              status: "SUCCESS",
            },
            select: {
              id: true,
            },
            take: 1,
          },
          mentorPayout: true,
        },
      });

      if (!booking) {
        throw new Error("BOOKING_NOT_FOUND");
      }

      // Make repeated completion requests safe.
      if (booking.status === "COMPLETED") {
        if (!booking.mentorPayout) {
          throw new Error("PAYOUT_RECORD_MISSING");
        }

        return booking;
      }

      if (booking.status !== "CONFIRMED") {
        throw new Error("BOOKING_NOT_CONFIRMED");
      }

      if (booking.payments.length === 0) {
        throw new Error("SUCCESSFUL_PAYMENT_NOT_FOUND");
      }

      if (booking.availability.endAt > new Date()) {
        throw new Error("SESSION_NOT_ENDED");
      }

      const updated = await tx.booking.updateMany({
        where: {
          id: bookingId,
          status: "CONFIRMED",
        },
        data: {
          status: "COMPLETED",
        },
      });

      if (updated.count !== 1) {
        throw new Error("BOOKING_STATUS_CHANGED");
      }

      // No platform commission: payout amount equals the booking amount.
      await tx.mentorPayout.create({
        data: {
          bookingId: booking.id,
          mentorProfileId: booking.availability.mentorProfileId,
          amount: booking.amount,
          currency: booking.currency,
          status: "PENDING",
        },
      });

      const completedBooking = await tx.booking.findUnique({
        where: {
          id: bookingId,
        },
        include: {
          mentorPayout: true,
        },
      });

      if (!completedBooking) {
        throw new Error("BOOKING_NOT_FOUND");
      }

      return completedBooking;
    },
    {
      isolationLevel: "Serializable",
      maxWait: 10000,
      timeout: 15000,
    }
  );
};