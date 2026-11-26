
import type { Request, Response } from "express";

import * as authService from "./auth.service.js";

import {
  registerSchema,
  loginSchema,
  googleAuthSchema,
} from "./auth.validation.js";

// =====================================
// COOKIE CONFIGURATION
// =====================================

// =====================================
// COOKIE CONFIGURATION
// =====================================

const isProduction = process.env.NODE_ENV === "production";

const refreshCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: (isProduction ? "none" : "lax") as
    | "none"
    | "lax",
  path: "/api/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const setRefreshCookie = (res: Response, token: string) => {
  res.cookie("refreshToken", token, refreshCookieOptions);
};

const clearRefreshCookie = (res: Response) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/api/auth",
  });
};

// =====================================
// REGISTER
// =====================================

export const register = async (req: Request, res: Response) => {
  try {
    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten(),
      });
    }

    const result = await authService.registerUser(parsed.data);

    // Establish persistent session.
    setRefreshCookie(res, result.refreshToken);

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "EMAIL_ALREADY_EXISTS"
    ) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    console.error("Registration error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to register user",
    });
  }
};

// =====================================
// LOGIN
// =====================================

export const login = async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password format",
        errors: parsed.error.flatten(),
      });
    }

    const result = await authService.loginUser(parsed.data);

    setRefreshCookie(res, result.refreshToken);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "INVALID_CREDENTIALS"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to login",
    });
  }
};

// =====================================
// GOOGLE LOGIN / SIGNUP
// =====================================

export const googleAuth = async (req: Request, res: Response) => {
  try {
    const parsed = googleAuthSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid Google authentication request",
        errors: parsed.error.flatten(),
      });
    }

    const result = await authService.googleAuthUser(
      parsed.data.idToken,
      parsed.data.role
    );

    // Set refresh token in HTTP-only cookie.
    setRefreshCookie(res, result.refreshToken);

    return res.status(200).json({
      success: true,
      message: "Google authentication successful",
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      switch (error.message) {
        case "INVALID_GOOGLE_TOKEN":
        case "INVALID_GOOGLE_ACCOUNT":
          return res.status(401).json({
            success: false,
            message: "Google authentication failed",
          });

        case "ROLE_REQUIRED":
          return res.status(400).json({
            success: false,
            message: "Please select Student or Mentor",
            code: "ROLE_REQUIRED",
          });

        case "ACCOUNT_DISABLED":
          return res.status(403).json({
            success: false,
            message: "Your account is disabled",
          });
      }
    }

    console.error("Google authentication error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to authenticate with Google",
    });
  }
};

// =====================================
// REFRESH ACCESS TOKEN
// =====================================

export const refresh = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Refresh token missing",
      });
    }

    const result = await authService.refreshUserToken(token);

    setRefreshCookie(res, result.refreshToken);

    return res.status(200).json({
      success: true,
      message: "Token refreshed",
      data: {
        accessToken: result.accessToken,
      },
    });
  } catch {
    clearRefreshCookie(res);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token",
    });
  }
};

// =====================================
// LOGOUT
// =====================================

export const logout = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken;

    if (token) {
      await authService.logoutUser(token);
    }

    clearRefreshCookie(res);

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to logout",
    });
  }
};

// =====================================
// GET CURRENT USER
// =====================================

export const me = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const user = await authService.getCurrentUser(userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User account is unavailable",
      });
    }

    return res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error("Get current user error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch user",
    });
  }
};
