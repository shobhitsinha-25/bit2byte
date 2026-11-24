
import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  loginUser,
  registerUser,
  refreshSession,
  logoutUser,
  googleAuthUser,
} from "../services/auth.api";

import api, { setAccessToken } from "../../../services/api";

import type {
  AuthUser,
  LoginPayload,
  RegisterPayload,
} from "../types/auth.types";

// =====================================
// AUTH CONTEXT TYPE
// =====================================

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (payload: LoginPayload) => Promise<AuthUser>;

  register: (payload: RegisterPayload) => Promise<AuthUser>;

  googleLogin: (
    idToken: string,
    role?: "STUDENT" | "MENTOR"
  ) => Promise<AuthUser>;

  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

interface AuthProviderProps {
  children: ReactNode;
}

// =====================================
// AUTH PROVIDER
// =====================================

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // =====================================
  // RESTORE SESSION
  // =====================================

  const restoreSession = useCallback(async () => {
    try {
      // Get a new access token using the HTTP-only refresh cookie.
      const response = await refreshSession();

      const accessToken = response.data.accessToken;

      if (!accessToken) {
        throw new Error("Access token missing");
      }

      setAccessToken(accessToken);

      // Fetch the authenticated user using the new access token.
      const userResponse = await api.get("/auth/me");

      setUser(userResponse.data.data.user);
    } catch {
      setAccessToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  // =====================================
  // EMAIL / PASSWORD LOGIN
  // =====================================

  const login = async (
    payload: LoginPayload
  ): Promise<AuthUser> => {
    const response = await loginUser(payload);

    const { user, accessToken } = response.data;

    if (!accessToken) {
      throw new Error("Access token missing from login response");
    }

    setAccessToken(accessToken);
    setUser(user);

    return user;
  };

  // =====================================
  // EMAIL / PASSWORD REGISTER
  // =====================================

 const register = async (
  payload: RegisterPayload
): Promise<AuthUser> => {
  const response = await registerUser(payload);

  const { user, accessToken } = response.data;

  if (!accessToken) {
    throw new Error("Access token missing from registration response");
  }

  setAccessToken(accessToken);
  setUser(user);

  return user;
};

  // =====================================
  // GOOGLE LOGIN / SIGNUP
  // =====================================

  const googleLogin = async (
    idToken: string,
    role?: "STUDENT" | "MENTOR"
  ): Promise<AuthUser> => {
    const response = await googleAuthUser(idToken, role);

    const { user, accessToken } = response.data;

    if (!accessToken) {
      throw new Error("Access token missing from Google response");
    }

    setAccessToken(accessToken);
    setUser(user);

    return user;
  };

  // =====================================
  // LOGOUT
  // =====================================

  const logout = async (): Promise<void> => {
    try {
      await logoutUser();
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  // =====================================
  // PROVIDER
  // =====================================

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        googleLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
