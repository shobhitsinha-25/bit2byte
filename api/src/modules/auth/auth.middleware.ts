
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import type { AuthTokenPayload } from "./auth.types.js";
import type { Role } from "../../generated/prisma/client.js";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

if (!ACCESS_SECRET) {
  throw new Error("JWT_ACCESS_SECRET is not configured");
}

// =====================================
// EXPRESS REQUEST TYPE EXTENSION
// =====================================

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: Role;
      };
    }
  }
}

// =====================================
// AUTHENTICATION MIDDLEWARE
// =====================================

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access token missing",
    });
  }

  try {
    const decoded = jwt.verify(token, ACCESS_SECRET);

    // Reject unexpected JWT payload types.
    if (typeof decoded === "string") {
      return res.status(401).json({
        success: false,
        message: "Invalid access token payload",
      });
    }

    const payload = decoded as jwt.JwtPayload & Partial<AuthTokenPayload>;

    // Validate required JWT claims.
    if (
      typeof payload.sub !== "string" ||
      !payload.sub ||
      !payload.role ||
      !["STUDENT", "MENTOR", "ADMIN"].includes(payload.role)
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid access token payload",
      });
    }

    req.user = {
      id: payload.sub,
      role: payload.role,
    };

    return next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired access token",
    });
  }
};

// =====================================
// ROLE AUTHORIZATION MIDDLEWARE
// =====================================

export const authorize = (...allowedRoles: Role[]) => {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to access this resource",
      });
    }

    return next();
  };
};
