import { Link } from "react-router-dom";
import { Code2, Menu, X } from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Learning Paths", href: "/#learning-paths" },
    { name: "Find Mentors", href: "/#mentors" },
    { name: "How It Works", href: "/#how-it-works" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0B1020]/90 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400">
            <Code2 size={24} />
          </div>

          <span className="text-xl font-bold tracking-tight text-white">
            Dev<span className="text-violet-400">Club</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-slate-400 transition-colors hover:text-white"
            >
              {link.name}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/login"
            className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:text-white"
          >
            Log in
          </Link>

          <Link
            to="/register"
            className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition-all hover:bg-violet-500 hover:shadow-violet-500/30"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className="rounded-lg p-2 text-slate-300 transition-colors hover:bg-white/10 md:hidden"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="border-t border-white/10 bg-[#0B1020] px-5 py-5 md:hidden">
          <div className="flex flex-col gap-5">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="text-sm font-medium text-slate-300 transition-colors hover:text-violet-400"
              >
                {link.name}
              </a>
            ))}

            <div className="flex flex-col gap-3 border-t border-white/10 pt-4">
              <Link
                to="/login"
                onClick={() => setIsMenuOpen(false)}
                className="rounded-lg border border-white/10 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-white/5"
              >
                Log in
              </Link>

              <Link
                to="/register"
                onClick={() => setIsMenuOpen(false)}
                className="rounded-lg bg-violet-600 px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-violet-500"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;