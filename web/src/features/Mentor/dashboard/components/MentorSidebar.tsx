
import {
  LayoutDashboard,
  Brain,
  Users,
  CalendarDays,
  Clock,
  UserRound,
  LogOut,
  GraduationCap,
} from "lucide-react";

import { Link, useLocation } from "react-router-dom";

interface MentorSidebarProps {
  onLogout: () => void;
}

const navigation = [
  {
    label: "Dashboard",
    path: "/mentor/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "My Expertise",
    path: "/mentor/expertise",
    icon: Brain,
  },
  {
    label: "My Students",
    path: "/mentor/students",
    icon: Users,
  },
  {
    label: "My Sessions",
    path: "/mentor/sessions",
    icon: CalendarDays,
  },
  {
    label: "Availability",
    path: "/mentor/availability",
    icon: Clock,
  },
  {
    label: "My Profile",
    path: "/mentor/profile",
    icon: UserRound,
  },
];

export default function MentorSidebar({
  onLogout,
}: MentorSidebarProps) {
  const location = useLocation();

  return (
    <>
      {/* Desktop Sidebar */}

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">

        {/* Branding */}

        <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6">
          <div className="rounded-xl bg-violet-600 p-2 text-white">
            <GraduationCap size={23} />
          </div>

          <span className="text-xl font-bold text-slate-900">
            Bit2<span className="text-violet-600">Byte</span>
          </span>
        </div>

        {/* Navigation */}

        <div className="px-5 py-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Mentor Menu
          </p>

          <nav className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;

              const active =
                location.pathname === item.path ||
                location.pathname.startsWith(`${item.path}/`);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-violet-50 text-violet-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon size={19} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Logout */}

        <div className="mt-auto border-t border-slate-100 p-5">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut size={19} />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Navigation */}

      <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-slate-200 bg-white px-2 py-2 lg:hidden">
        {navigation.map((item) => {
          const Icon = item.icon;

          const active =
            location.pathname === item.path ||
            location.pathname.startsWith(`${item.path}/`);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-[10px] font-medium ${
                active ? "text-violet-700" : "text-slate-500"
              }`}
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
