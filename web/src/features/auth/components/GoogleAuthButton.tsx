
import { useState } from "react";
import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../../hooks/useAuth";
import type { UserRole } from "../types/auth.types";

const GoogleAuthButton = () => {
  const { googleLogin } = useAuth();
  const navigate = useNavigate();

  const [idToken, setIdToken] = useState<string | null>(null);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"STUDENT" | "MENTOR">(
    "STUDENT"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const redirectUser = (role: UserRole) => {
    if (role === "STUDENT") {
      navigate("/student/dashboard", { replace: true });
    } else if (role === "MENTOR") {
      navigate("/mentor/dashboard", { replace: true });
    } else {
      navigate("/admin/dashboard", { replace: true });
    }
  };

  const handleGoogleAuth = async (
    token: string,
    role?: "STUDENT" | "MENTOR"
  ) => {
    setLoading(true);
    setError("");

    try {
      const user = await googleLogin(token, role);
      redirectUser(user.role);
    } catch (err: unknown) {
      if (
        axios.isAxiosError(err) &&
        err.response?.data?.code === "ROLE_REQUIRED"
      ) {
        setIdToken(token);
        setShowRoleSelection(true);
      } else if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            "Google authentication failed. Please try again."
        );
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSubmit = async () => {
    if (!idToken) return;

    await handleGoogleAuth(idToken, selectedRole);
  };

  return (
    <div className="w-full space-y-4">
      {!showRoleSelection && (
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={(credentialResponse) => {
              if (!credentialResponse.credential) {
                setError("Google did not provide an ID token.");
                return;
              }

              void handleGoogleAuth(credentialResponse.credential);
            }}
            onError={() => {
              setError("Google sign-in was unsuccessful.");
            }}
            theme="outline"
            size="large"
            text="continue_with"
            shape="rectangular"
            width="320"
          />
        </div>
      )}

      {showRoleSelection && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-white">
              Choose your account type
            </h3>
            <p className="mt-1 text-sm text-gray-400">
              Select how you want to use Developers Club.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedRole("STUDENT")}
              className={`rounded-lg border p-4 text-left transition ${
                selectedRole === "STUDENT"
                  ? "border-violet-500 bg-violet-500/10"
                  : "border-white/10 hover:border-white/30"
              }`}
            >
              <span className="block font-medium text-white">
                Student
              </span>
              <span className="mt-1 block text-xs text-gray-400">
                Learn DSA and improve your skills.
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole("MENTOR")}
              className={`rounded-lg border p-4 text-left transition ${
                selectedRole === "MENTOR"
                  ? "border-violet-500 bg-violet-500/10"
                  : "border-white/10 hover:border-white/30"
              }`}
            >
              <span className="block font-medium text-white">
                Mentor
              </span>
              <span className="mt-1 block text-xs text-gray-400">
                Guide students and share your expertise.
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => void handleRoleSubmit()}
            disabled={loading}
            className="w-full rounded-lg bg-violet-600 px-4 py-3 font-medium text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Continue with Google"}
          </button>

          <button
            type="button"
            onClick={() => {
              setShowRoleSelection(false);
              setIdToken(null);
              setError("");
            }}
            className="w-full text-sm text-gray-400 hover:text-white"
          >
            Cancel
          </button>
        </div>
      )}

      {loading && !showRoleSelection && (
        <p className="text-center text-sm text-gray-400">
          Signing you in...
        </p>
      )}

      {error && (
        <p className="text-center text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
};

export default GoogleAuthButton;
