
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Eye,
  EyeOff,
  UserRound,
  Mail,
  LockKeyhole,
} from "lucide-react";

import AuthLayout from "../components/AuthLayout";
import GoogleAuthButton from "../components/GoogleAuthButton";
import { useAuth } from "../../../hooks/useAuth";
import type { RegisterPayload } from "../types/auth.types";

type RegistrationRole = "STUDENT" | "MENTOR";

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  educationLevel: string;
  institution: string;
  headline: string;
  yearsOfExperience: number;
  hourlyRate: number;
}

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [role, setRole] = useState<RegistrationRole>("STUDENT");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState<RegisterFormData>({
    name: "",
    email: "",
    password: "",
    educationLevel: "",
    institution: "",
    headline: "",
    yearsOfExperience: 0,
    hourlyRate: 0,
  });

  // =====================================
  // UPDATE FORM FIELDS
  // =====================================

  const updateField = <K extends keyof RegisterFormData>(
    field: K,
    value: RegisterFormData[K]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // =====================================
  // REDIRECT AFTER REGISTRATION
  // =====================================

  const redirectUser = (userRole: RegistrationRole) => {
    if (userRole === "STUDENT") {
      navigate("/student/dashboard", { replace: true });
    } else {
      navigate("/mentor/dashboard", { replace: true });
    }
  };

  // =====================================
  // EMAIL / PASSWORD REGISTRATION
  // =====================================

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const payload: RegisterPayload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role,

        ...(role === "STUDENT"
          ? {
              educationLevel: formData.educationLevel || undefined,
              institution: formData.institution.trim() || undefined,
            }
          : {
              headline: formData.headline.trim(),
              yearsOfExperience: Number(formData.yearsOfExperience),
              hourlyRate: Number(formData.hourlyRate),
            }),
      };

      const registeredUser = await register(payload);

      if (
  registeredUser.role === "STUDENT" ||
  registeredUser.role === "MENTOR"
) {
  redirectUser(registeredUser.role);
} else {
  navigate("/login");
}
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const message = err.response?.data?.message;

        if (status === 409) {
          setError(
            "An account with this email already exists. Please log in instead."
          );
        } else {
          setError(
            message || "Unable to create your account. Please try again."
          );
        }
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // INPUT STYLES
  // =====================================

  const inputClass =
    "w-full rounded-lg border border-white/10 bg-[#0B1020] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-500";

  // =====================================
  // UI
  // =====================================

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start learning, practicing and growing with DevClub."
      footerText="Already have an account?"
      footerLinkText="Log in"
      footerLink="/login"
    >
      <div className="space-y-5">

        {/* =====================================
            EMAIL / PASSWORD REGISTRATION
        ===================================== */}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Account Role */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              I want to join as
            </label>

            <div className="grid grid-cols-2 gap-3">
              {(["STUDENT", "MENTOR"] as RegistrationRole[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setRole(item);
                    setError("");
                  }}
                  aria-pressed={role === item}
                  className={`rounded-lg border py-3 text-sm font-semibold transition ${
                    role === item
                      ? "border-violet-500 bg-violet-500/10 text-violet-300"
                      : "border-white/10 bg-[#0B1020] text-slate-400 hover:border-white/20"
                  }`}
                >
                  {item === "STUDENT" ? "Student" : "Mentor"}
                </button>
              ))}
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Full name
            </label>

            <div className="relative">
              <UserRound
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                minLength={2}
                maxLength={100}
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Your full name"
                className={`${inputClass} pl-10`}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Email address
            </label>

            <div className="relative">
              <Mail
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="you@example.com"
                className={`${inputClass} pl-10`}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Password
            </label>

            <div className="relative">
              <LockKeyhole
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={72}
                value={formData.password}
                onChange={(e) => updateField("password", e.target.value)}
                placeholder="At least 8 characters"
                className={`${inputClass} pl-10 pr-12`}
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-white"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Student-specific fields */}
          {role === "STUDENT" && (
            <>
              <div>
                <label
                  htmlFor="educationLevel"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Education level
                </label>

                <select
                  id="educationLevel"
                  name="educationLevel"
                  value={formData.educationLevel}
                  onChange={(e) =>
                    updateField("educationLevel", e.target.value)
                  }
                  className={inputClass}
                >
                  <option value="">Select education level</option>
                  <option value="SCHOOL">School</option>
                  <option value="COLLEGE">College</option>
                  <option value="GRADUATE">Graduate</option>
                  <option value="WORKING_PROFESSIONAL">
                    Working professional
                  </option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="institution"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Institution (optional)
                </label>

                <input
                  id="institution"
                  name="institution"
                  type="text"
                  value={formData.institution}
                  onChange={(e) =>
                    updateField("institution", e.target.value)
                  }
                  placeholder="School or college name"
                  className={inputClass}
                />
              </div>
            </>
          )}

          {/* Mentor-specific fields */}
          {role === "MENTOR" && (
            <>
              <div>
                <label
                  htmlFor="headline"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Professional headline
                </label>

                <input
                  id="headline"
                  name="headline"
                  type="text"
                  required
                  maxLength={150}
                  value={formData.headline}
                  onChange={(e) => updateField("headline", e.target.value)}
                  placeholder="e.g. Software Engineer | DSA Mentor"
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="yearsOfExperience"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Years of experience
                </label>

                <input
                  id="yearsOfExperience"
                  name="yearsOfExperience"
                  type="number"
                  min="0"
                  max="60"
                  required
                  value={formData.yearsOfExperience}
                  onChange={(e) =>
                    updateField("yearsOfExperience", Number(e.target.value))
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="hourlyRate"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Hourly rate (INR)
                </label>

                <input
                  id="hourlyRate"
                  name="hourlyRate"
                  type="number"
                  min="1"
                  max="100000"
                  required
                  value={formData.hourlyRate || ""}
                  onChange={(e) =>
                    updateField("hourlyRate", Number(e.target.value))
                  }
                  placeholder="e.g. 500"
                  className={inputClass}
                />
              </div>
            </>
          )}

          {/* Error Message */}
          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400"
            >
              {error}
            </p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-violet-600 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>

          <p className="text-center text-xs leading-5 text-slate-500">
            By creating an account, you agree to our Terms of Service and
            Privacy Policy.
          </p>
        </form>

        {/* =====================================
            DIVIDER
        ===================================== */}

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />

          <span className="text-xs font-medium text-slate-500">
            OR SIGN UP WITH
          </span>

          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* =====================================
            GOOGLE SIGNUP
        ===================================== */}

        <GoogleAuthButton />

      </div>
    </AuthLayout>
  );
};

export default Register;
