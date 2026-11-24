
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createHash, randomUUID } from "node:crypto";
import { OAuth2Client } from "google-auth-library";

import prisma from "../../config/database.js";
import type { Role } from "../../generated/prisma/client.js";

import type {
  RegisterInput,
  LoginInput,
} from "./auth.validation.js";

import type { AuthTokenPayload } from "./auth.types.js";

// =====================================
// CONFIGURATION
// =====================================

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error("JWT secrets are not configured");
}

if (!GOOGLE_CLIENT_ID) {
  throw new Error("GOOGLE_CLIENT_ID is not configured");
}

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// =====================================
// TOKEN UTILITIES
// =====================================

const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

const generateAccessToken = (userId: string, role: Role) => {
  return jwt.sign(
    { sub: userId, role },
    ACCESS_SECRET,
    { expiresIn: "15m" }
  );
};

const generateRefreshToken = (userId: string, role: Role) => {
  return jwt.sign(
    { sub: userId, role, jti: randomUUID() },
    REFRESH_SECRET,
    { expiresIn: "7d" }
  );
};

// =====================================
// CREATE AUTHENTICATED SESSION
// =====================================

const createUserSession = async (user: {
  id: string;
  role: Role;
}) => {
  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id, user.role);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      refreshTokenHash: hashToken(refreshToken),
    },
  });

  return {
    accessToken,
    refreshToken,
  };
};

// =====================================
// REGISTER WITH EMAIL AND PASSWORD
// =====================================

export const registerUser = async (data: RegisterInput) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new Error("EMAIL_ALREADY_EXISTS");
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await prisma.$transaction(async (tx) => {
    return tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role,

        ...(data.role === "STUDENT"
          ? {
              studentProfile: {
                create: {
                  educationLevel: data.educationLevel,
                  institution: data.institution,
                  bio: data.bio,
                },
              },
            }
          : {
              mentorProfile: {
                create: {
                  headline: data.headline,
                  bio: data.bio,
                  yearsOfExperience: data.yearsOfExperience ?? 0,
                  hourlyRate: data.hourlyRate!,
                },
              },
            }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  });

  // Create the same authenticated session used by login.
  const session = await createUserSession(user);

  return {
    user,
    ...session,
  };
};

// =====================================
// LOGIN WITH EMAIL AND PASSWORD
// =====================================

export const loginUser = async (data: LoginInput) => {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  // Google-only accounts have no passwordHash.
  if (!user || !user.isActive || !user.passwordHash) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const passwordValid = await bcrypt.compare(
    data.password,
    user.passwordHash
  );

  if (!passwordValid) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const session = await createUserSession(user);

  return {
    ...session,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};

// =====================================
// GOOGLE AUTHENTICATION
// =====================================

export const googleAuthUser = async (
  idToken: string,
  role?: "STUDENT" | "MENTOR"
) => {
  // 1. Verify Google ID token.
  let googlePayload;

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    googlePayload = ticket.getPayload();
  } catch {
    throw new Error("INVALID_GOOGLE_TOKEN");
  }

  // 2. Validate Google account information.
  if (
    !googlePayload ||
    !googlePayload.sub ||
    !googlePayload.email ||
    !googlePayload.email_verified ||
    !googlePayload.name
  ) {
    throw new Error("INVALID_GOOGLE_ACCOUNT");
  }

  const googleId = googlePayload.sub;
  const email = googlePayload.email.toLowerCase();
  const name = googlePayload.name;

  // 3. Check whether this Google account is already linked.
  let user = await prisma.user.findUnique({
    where: { googleId },
  });

  if (user) {
    if (!user.isActive) {
      throw new Error("ACCOUNT_DISABLED");
    }
  } else {
    // 4. Check whether an account already exists with this email.
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      if (!existingUser.isActive) {
        throw new Error("ACCOUNT_DISABLED");
      }

      // Link Google to the existing verified-email account.
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          googleId,
        },
      });
    } else {
      // 5. New users must select their account role.
      if (!role || !["STUDENT", "MENTOR"].includes(role)) {
        throw new Error("ROLE_REQUIRED");
      }

      // 6. Create user and profile transactionally.
      user = await prisma.$transaction(async (tx) => {
        return tx.user.create({
          data: {
            name,
            email,
            googleId,
            passwordHash: null,
            role,

            ...(role === "STUDENT"
              ? {
                  studentProfile: {
                    create: {},
                  },
                }
              : {
                  mentorProfile: {
                    create: {
                      hourlyRate: 0,
                    },
                  },
                }),
          },
        });
      });
    }
  }

  // 7. Generate your application's JWT session.
  const session = await createUserSession(user);

  return {
    ...session,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};

// =====================================
// REFRESH ACCESS TOKEN
// =====================================

export const refreshUserToken = async (token: string) => {
  let payload: AuthTokenPayload;

  try {
    payload = jwt.verify(
      token,
      REFRESH_SECRET
    ) as AuthTokenPayload;
  } catch {
    throw new Error("INVALID_REFRESH_TOKEN");
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
  });

  if (!user || !user.isActive || user.role !== payload.role) {
    throw new Error("INVALID_REFRESH_TOKEN");
  }

  const tokenHash = hashToken(token);

  if (
    !user.refreshTokenHash ||
    user.refreshTokenHash !== tokenHash
  ) {
    throw new Error("INVALID_REFRESH_TOKEN");
  }

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id, user.role);

  // Atomic refresh-token rotation.
  const result = await prisma.user.updateMany({
    where: {
      id: user.id,
      refreshTokenHash: tokenHash,
    },
    data: {
      refreshTokenHash: hashToken(refreshToken),
    },
  });

  if (result.count !== 1) {
    throw new Error("INVALID_REFRESH_TOKEN");
  }

  return {
    accessToken,
    refreshToken,
  };
};

// =====================================
// LOGOUT
// =====================================

export const logoutUser = async (token: string) => {
  let payload: AuthTokenPayload;

  try {
    payload = jwt.verify(
      token,
      REFRESH_SECRET
    ) as AuthTokenPayload;
  } catch {
    // An expired or invalid token needs no further revocation.
    return;
  }

  await prisma.user.updateMany({
    where: {
      id: payload.sub,
      refreshTokenHash: hashToken(token),
    },
    data: {
      refreshTokenHash: null,
    },
  });
};

// =====================================
// GET CURRENT USER
// =====================================

export const getCurrentUser = async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      studentProfile: true,
      mentorProfile: true,
    },
  });
};
