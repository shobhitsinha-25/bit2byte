import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Code2 } from "lucide-react";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footerText: string;
  footerLinkText: string;
  footerLink: string;
}

const AuthLayout = ({
  title,
  subtitle,
  children,
  footerText,
  footerLinkText,
  footerLink,
}: AuthLayoutProps) => {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0B1020] px-4 py-10">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400">
            <Code2 size={24} />
          </div>

          <span className="text-2xl font-bold text-white">
            Dev<span className="text-violet-400">Club</span>
          </span>
        </Link>

        {/* Form Card */}
        <div className="rounded-2xl border border-white/10 bg-[#151D32] p-7 shadow-2xl sm:p-9">
          <div className="mb-7 text-center">
            <h1 className="text-2xl font-bold text-white">{title}</h1>
            <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
          </div>

          {children}

          <p className="mt-7 text-center text-sm text-slate-400">
            {footerText}{" "}
            <Link
              to={footerLink}
              className="font-semibold text-violet-400 hover:text-violet-300"
            >
              {footerLinkText}
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} DevClub. All rights reserved.
        </p>
      </div>
    </main>
  );
};

export default AuthLayout;