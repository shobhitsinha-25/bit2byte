
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

import MentorSidebar from "../features/Mentor/dashboard/components/MentorSidebar";
import StudentSidebar from "../features/Student/dashboard/components/StudentSidebar";

type DashboardRole = "STUDENT" | "MENTOR";

interface DashboardLayoutProps {
  role: DashboardRole;
  children: ReactNode;
}

export default function DashboardLayout({
  role,
  children,
}: DashboardLayoutProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isStudent = role === "STUDENT";

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Role-based Sidebar */}

      {isStudent ? (
        <StudentSidebar onLogout={handleLogout} />
      ) : (
        <MentorSidebar onLogout={handleLogout} />
      )}

      {/* Main Content */}

      <div className="lg:pl-64">

        {/* Header */}

        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8">
          <div>
            <p className="text-sm text-slate-500">
              {isStudent ? "Student Portal" : "Mentor Portal"}
            </p>

            <p className="font-semibold text-slate-900">
              {user?.name || (isStudent ? "Student" : "Mentor")}
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 font-bold text-violet-700">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
        </header>

        {/* Page Content */}

        <main className="p-5 pb-24 sm:p-8 lg:pb-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}
