"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import HeroButton from "./hero-button";
import { useAuth } from "../context/AuthContext";

import { Crown } from "lucide-react";

type NavLink = { href: string; label: string };

const guestLinks: NavLink[] = [
  { href: "/about-us", label: "About" },
  { href: "/timeline", label: "Timeline" },
  { href: "/levels", label: "Levels" },
  { href: "/package", label: "Packages" },
];

const authLinks: NavLink[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/payouts", label: "Payouts" },
  { href: "/wallet", label: "Wallet" },
  { href: "/team", label: "My Team" },
  { href: "/profile", label: "Profile" },
];

const navbarVariants = {
  hidden: { opacity: 0, y: "-100%" },
  show: {
    opacity: 1,
    y: "0%",
    transition: { duration: 0.5 },
  },
};

interface NavbarProps {
  userLevel?: string;
}

export default function Navbar({ userLevel: propUserLevel }: NavbarProps) {
  const { isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();


  const links = isAuthenticated ? authLinks : guestLinks;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname?.startsWith(href);

  const navItemClass = (href: string) =>
    [
      "relative px-2 py-1 text-sm md:text-[15px] transition",
      "text-zinc-200 hover:text-white",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 rounded-md",
      isActive(href) && "text-white",
    ]
      .filter(Boolean)
      .join(" ");

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.documentElement.classList.add("overflow-y-hidden");
    } else {
      document.documentElement.classList.remove("overflow-y-hidden");
    }
    return () => {
      document.documentElement.classList.remove("overflow-y-hidden");
    };
  }, [open]);

  return (
    <motion.header
      variants={navbarVariants}
      initial={prefersReducedMotion ? undefined : "hidden"}
      animate="show"
      className="fixed inset-x-0 top-0 z-50"
      role="banner"
    >
      {/* Glass shell */}
      <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6">
        <div
          className="mt-3 rounded-2xl border border-white/10 bg-black/35 backdrop-blur-xl
                     shadow-[0_8px_40px_rgba(0,0,0,0.35)]"
        >
          {/* Top row */}
          <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-6">
            {/* Logo + brand */}
            <Link
              href="/"
              className="group flex items-center gap-2.5"
              aria-label="Sagenex home"
            >
              <span className="relative inline-block h-8 w-8">
                <Image
                  src="/icon.png"
                  alt="Sagenex"
                  fill
                  sizes="32px"
                  className="object-contain"
                  priority
                />
              </span>
              <span className="text-base font-semibold tracking-tight text-white group-hover:opacity-90">
                Sagenex
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={navItemClass(l.href)}
                  aria-current={isActive(l.href) ? "page" : undefined}
                >
                  {l.label}
                  {/* Active underline */}
                  {isActive(l.href) && (
                    <span className="absolute left-2 right-2 -bottom-1 h-px bg-gradient-to-r from-transparent via-emerald-300/70 to-transparent" />
                  )}
                </Link>
              ))}
            </nav>

            {/* Right actions */}
            <div className="hidden md:flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  {propUserLevel && (
                    <div className="flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1.5 text-sm font-semibold text-emerald-300 border border-emerald-600/50">
                      <Crown className="h-4 w-4" />
                      <span>{propUserLevel}</span>
                    </div>
                  )}
                  <button
                    onClick={logout}
                    className="px-3.5 py-2 rounded-lg text-sm font-medium text-white/90 hover:text-white
                             bg-gradient-to-b from-red-500 to-red-600 hover:from-red-500/95 hover:to-red-600/95
                             shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_8px_20px_rgba(239,68,68,0.35)]
                             focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/70"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <HeroButton href="/login">Login</HeroButton>
              )}
            </div>

            {/* Mobile toggle */}
            <button
              className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10
                         bg-white/5 text-white/90 hover:bg-white/10
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
              aria-label="Toggle navigation"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              <svg
                viewBox="0 0 24 24"
                className={`h-5 w-5 transition ${open ? "rotate-90" : ""}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                {open ? (
                  <path d="M6 6l12 12M6 18L18 6" />
                ) : (
                  <path d="M3.75 7.25h16.5M3.75 12h16.5M3.75 16.75h16.5" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile drawer */}
          <motion.div
            initial={false}
            animate={
              open ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }
            }
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="md:hidden overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1">
              <nav className="flex flex-col">
                {links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className={[
                      "flex items-center justify-between rounded-lg px-3 py-2 text-sm",
                      "text-zinc-200 hover:text-white hover:bg-white/5",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70",
                      isActive(l.href) && "bg-white/5 text-white",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    aria-current={isActive(l.href) ? "page" : undefined}
                  >
                    {l.label}
                    {isActive(l.href) && (
                      <span className="ml-3 h-1.5 w-1.5 rounded-full bg-emerald-300" />
                    )}
                  </Link>
                ))}
              </nav>

              <div className="mt-3">
                {isAuthenticated ? (
                  <button
                    onClick={() => {
                      setOpen(false);
                      logout();
                    }}
                    className="w-full px-3.5 py-2 rounded-lg text-sm font-medium text-white/90 hover:text-white
                               bg-gradient-to-b from-red-500 to-red-600 hover:from-red-500/95 hover:to-red-600/95
                               shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_8px_20px_rgba(239,68,68,0.35)]
                               focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/70"
                  >
                    Logout
                  </button>
                ) : (
                  <HeroButton className="w-full justify-center" href="/login">
                    Login
                  </HeroButton>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Top sheen line */}
      <div className="pointer-events-none absolute inset-x-0 top-0">
        <div className="mx-auto h-[1px] w-full max-w-7xl bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      </div>
    </motion.header>
  );
}
