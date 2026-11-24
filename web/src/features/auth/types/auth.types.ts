
export type UserRole = "STUDENT" | "MENTOR" | "ADMIN";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: "STUDENT" | "MENTOR";
  educationLevel?: string;
  institution?: string;
  bio?: string;
  headline?: string;
  yearsOfExperience?: number;
  hourlyRate?: number;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: AuthUser;
    accessToken?: string;
  };
}
