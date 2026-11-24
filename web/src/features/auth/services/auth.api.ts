
import api from "../../../services/api";

import type {
  LoginPayload,
  RegisterPayload,
  AuthResponse,
} from "../types/auth.types";

export const loginUser = async (
  payload: LoginPayload
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/auth/login", payload);
  return response.data;
};

export const registerUser = async (
  payload: RegisterPayload
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/auth/register", payload);
  return response.data;
};

// Share one refresh request between concurrent callers.
let refreshPromise: Promise<AuthResponse> | null = null;

export const refreshSession = (): Promise<AuthResponse> => {
  if (!refreshPromise) {
    refreshPromise = api
      .post<AuthResponse>("/auth/refresh")
      .then((response) => response.data)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

export const logoutUser = async (): Promise<void> => {
  await api.post("/auth/logout");
};

export const googleAuthUser = async (
  idToken: string,
  role?: "STUDENT" | "MENTOR"
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/auth/google", {
    idToken,
    ...(role ? { role } : {}),
  });

  return response.data;
};
