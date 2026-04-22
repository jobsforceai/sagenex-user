"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import HeroButton from "../../components/ui/hero-button";
import { useAuth } from "../context/AuthContext";
import { getRankProgress } from "@/actions/user";
import { stopImpersonation } from "@/actions/auth";
import { Crown, X, ShieldAlert, CornerUpLeft } from "lucide-react";

type NavLink = { href: string; label: string };

const guestLinks: NavLink[] = [
  { href: "/about-us", label: "About Us" },
  { href: "https://sggold.sgxmeta.ai/", label: "SGGOLD" },
  { href: "/sgbn", label: "SGBN" },
  { href: "/sgse", label: "SGSE" },
  { href: process.env.NEXT_PUBLIC_SGCHAIN_URL ?? "#", label: "SGChain" },
  { href: process.env.NEXT_PUBLIC_SG5TRADERS_URL ?? "#", label: "SG5Traders" },
  { href: process.env.NEXT_PUBLIC_ANDROID_APP_URL ?? "#", label: "Download App" },
];

const authLinks: NavLink[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/sgnx-gold", label: "SGNX Gold" },
  { href: "/courses", label: "Courses" },
  { href: "/kyc", label: "KYC" },
  { href: "/wallet", label: "Wallet" },
  { href: "/team", label: "My Team" },
  { href: "/profile", label: "Profile" },
  { href: process.env.NEXT_PUBLIC_ANDROID_APP_URL ?? "#", label: "Download App" },
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
  variant?: "full" | "minimal";
}

export default function Navbar({ userLevel: propUserLevel, variant = "full" }: NavbarProps) {
  const { isAuthenticated, logout, user, replaceSession } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [userLevel, setUserLevel] = useState<string | null>(null);
  const [cacheClearing, setCacheClearing] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncMessages, setSyncMessages] = useState<string[]>([]);
  const [syncDone, setSyncDone] = useState(false);
  const [syncSummary, setSyncSummary] = useState('');
  const [showTopBanner, setShowTopBanner] = useState(true);
  const [stoppingImpersonation, setStoppingImpersonation] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const isImpersonated = Boolean(isAuthenticated && user?.isImpersonated);
  const adminAppUrl = process.env.NEXT_PUBLIC_ADMIN_APP_URL ?? "http://localhost:3001";

  useEffect(() => {
    // Check if user has dismissed the banner
    const dismissed = localStorage.getItem('topBannerDismissed');
    if (dismissed === 'true') {
      setShowTopBanner(false);
    }
  }, []);

  const dismissTopBanner = () => {
    setShowTopBanner(false);
    localStorage.setItem('topBannerDismissed', 'true');
  };

  useEffect(() => {
    if (propUserLevel) {
      setUserLevel(propUserLevel);
      return;
    }
    if (isAuthenticated) {
      const fetchRank = async () => {
        try {
          const rankData = await getRankProgress();
          if (rankData && !rankData.error) {
            const levelName = rankData.performanceRank?.name || rankData.rank?.name;
            if (levelName) setUserLevel(levelName);
          }
        } catch (error) {
          console.error("Failed to fetch user rank for navbar:", error);
        }
      };
      fetchRank();
    }
  }, [isAuthenticated, propUserLevel]);

  const links = isAuthenticated ? authLinks : guestLinks;
  const isLandingGuest = !isAuthenticated && pathname === "/";

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname?.startsWith(href);

  const navItemClass = (href: string) =>
    [
      "relative px-2 py-1 text-sm md:text-[15px] transition",
      isLandingGuest
        ? "text-white/75 hover:text-white"
        : scrolled
          ? "text-zinc-700 hover:text-zinc-900"
          : "text-zinc-800 hover:text-zinc-900",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00b386]/50 rounded-md",
      isActive(href) && (isLandingGuest ? "text-emerald-300 font-semibold" : "text-[#00b386] font-semibold"),
    ]
      .filter(Boolean)
      .join(" ");

  // Only treat absolute http(s) URLs as "external"
  const isExternalHref = (href: string) => /^https?:\/\//i.test(href);

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

  const handleSyncProfile = async () => {
    setCacheClearing(true);
    setShowSyncModal(true);
    setSyncMessages(['Connecting to audit service...']);
    setSyncDone(false);
    setSyncSummary('');

    try {
      const token = document.cookie
        .split('; ')
        .find(r => r.startsWith('authToken='))
        ?.split('=')[1];

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? '';
      const res = await fetch(`${backendUrl}/api/v1/user/sync/stream`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok || !res.body) throw new Error('Failed to connect to sync service');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentEvent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n');
        buffer = parts.pop() ?? '';

        for (const line of parts) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (currentEvent === 'progress' && data.message) {
                setSyncMessages(prev => [...prev, data.message]);
              } else if (currentEvent === 'done') {
                setSyncDone(true);
                setSyncSummary(data.message ?? 'Audit complete.');
              } else if (currentEvent === 'error') {
                setSyncDone(true);
                setSyncSummary(data.message ?? 'Something went wrong.');
              }
            } catch {}
            currentEvent = '';
          }
        }
      }
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncMessages(prev => [...prev, 'Connection error. Please try again.']);
      setSyncDone(true);
      setSyncSummary('Sync failed. Please try again.');
    } finally {
      setCacheClearing(false);
    }
  };

  const handleSyncClose = () => {
    setShowSyncModal(false);
    window.location.reload();
  };

  const handleStopImpersonation = async () => {
    setStoppingImpersonation(true);
    try {
      const result = await stopImpersonation();
      if (result?.error) {
        throw new Error(result.error);
      }

      if (result?.token) {
        // Store returned admin token locally so same-origin admin shells can reuse it.
        replaceSession({ token: result.token, user: null });
      }

      if (typeof window !== "undefined") {
        window.location.href = adminAppUrl;
      }
    } catch (error) {
      console.error("Failed to stop impersonation:", error);
    } finally {
      setStoppingImpersonation(false);
    }
  };

  const headerTopClass = isImpersonated
    ? showTopBanner
      ? "top-20"
      : "top-10"
    : showTopBanner
      ? "top-10"
      : "top-0";

  return (
    <>
      {isImpersonated && (
        <div className="fixed inset-x-0 top-0 z-50 h-10 border-b border-sky-400/20 bg-sky-500/10 text-sky-100">
          <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-3 px-3 text-[11px] sm:px-4 sm:text-sm">
            <div className="flex min-w-0 items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0 text-sky-200" />
              <span className="truncate">
                You are viewing this account in an impersonation session.
                {user?.impersonatedByAdminId ? ` Admin: ${user.impersonatedByAdminId}` : ""}
              </span>
            </div>
            <button
              onClick={handleStopImpersonation}
              disabled={stoppingImpersonation}
              className="inline-flex shrink-0 items-center gap-1 rounded-md border border-sky-300/30 bg-sky-400/10 px-2 py-1 text-[11px] font-medium text-sky-50 hover:bg-sky-400/20 disabled:opacity-60"
            >
              <CornerUpLeft className="h-3.5 w-3.5" />
              {stoppingImpersonation ? "Returning..." : "Return to Admin"}
            </button>
          </div>
        </div>
      )}
      {showTopBanner && (
        <div className={`fixed inset-x-0 z-50 h-10 border-b border-amber-400/20 bg-amber-500/10 text-amber-100 ${isImpersonated ? "top-10" : "top-0"}`}>
          <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-3 text-[11px] sm:px-4 sm:text-sm">
            <span className="whitespace-nowrap overflow-x-auto flex-1">
              Updates to investments or bonuses can take up to 24 hours to appear across the site. If you see old data, use the "Sync Profile" button to refresh.
            </span>
            <button
              onClick={dismissTopBanner}
              className="ml-2 shrink-0 rounded p-1 hover:bg-amber-500/20 transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
      <motion.header
        variants={navbarVariants}
        initial={prefersReducedMotion ? undefined : "hidden"}
        animate="show"
        className={`fixed inset-x-0 z-50 ${headerTopClass}`}
        role="banner"
      >
      {/* Glass shell */}
      <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6">
        <div
          className={[
            "mt-3 rounded-2xl border transition-all duration-300",
            isLandingGuest
              ? scrolled
                ? "border-white/25 bg-[#6f0011]/80 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.32)]"
                : "border-white/20 bg-[#7b0012]/45 backdrop-blur-xl shadow-[0_12px_50px_rgba(0,0,0,0.25)]"
              : scrolled
                ? "border-(--border-light) bg-white shadow-[0_2px_20px_rgba(0,0,0,0.08)]"
                : "border-white/10 bg-white/0 backdrop-blur-xl shadow-none",
          ].join(" ")}
        >
          {/* Top row */}
          <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-6">
            {/* Logo + brand */}
            <Link
              href="/"
              className="group flex items-center gap-2.5"
              aria-label="Sagenex home"
            >
              <span className="relative inline-block h-13 w-13">
                <Image
                  src="/logo5.png"
                  alt="Sagenex"
                  fill
                  sizes="100vw"
                  className="object-fill rounded-full scale-125"
                  priority
                />
              </span>
              <span className={`text-base font-semibold tracking-tight group-hover:opacity-90 ${isLandingGuest ? "text-white" : "text-zinc-900"}`}>
                Sagenex
              </span>
            </Link>

            {/* Desktop nav */}
            {variant === "full" && (
              <nav className="hidden md:flex items-center gap-1">
                {links.map((l) => {
                  const external = isExternalHref(l.href);
                  return (
                    <Link
                      key={l.href}
                      href={l.href}
                      target={external ? "_blank" : undefined}
                      rel={external ? "noopener noreferrer" : undefined}
                      className={navItemClass(l.href)}
                      aria-current={isActive(l.href) ? "page" : undefined}
                    >
                      {l.label}
                      {/* Active underline */}
                      {isActive(l.href) && (
                        <span className={`absolute left-2 right-2 -bottom-1 h-px rounded-full ${isLandingGuest ? "bg-emerald-300" : "bg-[#00b386]"}`} />
                      )}
                    </Link>
                  );
                })}
              </nav>
            )}

            {/* Right actions */}
            <div className="hidden md:flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  {userLevel && variant === "full" && (
                    <div className="flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1.5 text-sm font-semibold text-emerald-300 border border-emerald-600/50">
                      <Crown className="h-4 w-4" />
                      <span>{userLevel}</span>
                    </div>
                  )}
                  <button
                    onClick={handleSyncProfile}
                    disabled={cacheClearing}
                    className="px-3.5 py-2 rounded-lg text-sm font-medium text-emerald-100/90 hover:text-emerald-50
                             bg-linear-to-b from-emerald-500 to-emerald-600 hover:from-emerald-500/95 hover:to-emerald-600/95
                             shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_8px_20px_rgba(16,185,129,0.35)]
                             focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70
                             disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {cacheClearing ? "Syncing..." : "Sync Profile"}
                  </button>
                  <button
                    onClick={logout}
                    className="px-3.5 py-2 rounded-lg text-sm font-medium text-white/90 hover:text-white
                             bg-linear-to-b from-red-500 to-red-600 hover:from-red-500/95 hover:to-red-600/95
                             shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_8px_20px_rgba(239,68,68,0.35)]
                             focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/70"
                  >
                    Logout
                  </button>
                </>
              ) : (
                isLandingGuest ? (
                  <Link
                    href="/login"
                    className="landing-nav-login-btn inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold text-white"
                  >
                    Login
                  </Link>
                ) : (
                  <HeroButton href="/login">Login</HeroButton>
                )
              )}
            </div>

            {/* Mobile toggle */}
            {variant === "full" && (
              <button
                className={`md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00b386]/50 ${
                  isLandingGuest
                    ? "border-white/30 bg-white/10 text-white hover:bg-white/20"
                    : "border-[#e8e8e8] bg-white text-zinc-700 hover:bg-[#f7f8fa]"
                }`}
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
            )}
          </div>

          {/* Mobile drawer */}
          {variant === "full" && (
            <motion.div
              initial={false}
              animate={open ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={`md:hidden overflow-hidden rounded-b-2xl ${isLandingGuest ? "bg-[#3f0912]/95 border-t border-white/10" : "bg-white"}`}
            >
              <div className="px-4 pb-4 pt-1">
                <nav className="flex flex-col">
                  {links.map((l) => {
                    const external = isExternalHref(l.href);
                    return (
                      <Link
                        key={l.href}
                        href={l.href}
                        target={external ? "_blank" : undefined}
                        rel={external ? "noopener noreferrer" : undefined}
                        onClick={() => setOpen(false)}
                        className={[
                          "flex items-center justify-between rounded-lg px-3 py-2 text-sm",
                          isLandingGuest
                            ? "text-white/80 hover:text-white hover:bg-white/10"
                            : "text-zinc-700 hover:text-zinc-900 hover:bg-[#f7f8fa]",
                          "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70",
                          isActive(l.href) && (isLandingGuest ? "bg-white/12 text-emerald-300" : "bg-[#e6f7f3] text-[#00b386]"),
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
                    );
                  })}
                </nav>

                <div className="mt-3">
                  {isAuthenticated ? (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => {
                          setOpen(false);
                          handleSyncProfile();
                        }}
                        disabled={cacheClearing}
                        className="w-full px-3.5 py-2 rounded-lg text-sm font-medium text-emerald-100/90 hover:text-emerald-50
                                 bg-linear-to-b from-emerald-500 to-emerald-600 hover:from-emerald-500/95 hover:to-emerald-600/95
                                 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_8px_20px_rgba(16,185,129,0.35)]
                                 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70
                                 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {cacheClearing ? "Syncing..." : "Sync Profile"}
                      </button>
                      {isImpersonated && (
                        <button
                          onClick={() => {
                            setOpen(false);
                            handleStopImpersonation();
                          }}
                          disabled={stoppingImpersonation}
                          className="w-full px-3.5 py-2 rounded-lg text-sm font-medium text-sky-50 hover:text-white
                                 bg-linear-to-b from-sky-500 to-sky-600 hover:from-sky-500/95 hover:to-sky-600/95
                                 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_8px_20px_rgba(14,165,233,0.35)]
                                 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70
                                 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {stoppingImpersonation ? "Returning..." : "Return to Admin"}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setOpen(false);
                          logout();
                        }}
                        className="w-full px-3.5 py-2 rounded-lg text-sm font-medium text-white/90 hover:text-white
                                 bg-linear-to-b from-red-500 to-red-600 hover:from-red-500/95 hover:to-red-600/95
                                 shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_8px_20px_rgba(239,68,68,0.35)]
                                 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/70"
                      >
                        Logout
                      </button>
                    </div>
                  ) : (
                    isLandingGuest ? (
                      <Link
                        className="landing-nav-login-btn inline-flex w-full items-center justify-center rounded-full px-5 py-2 text-sm font-semibold text-white"
                        href="/login"
                      >
                        Login
                      </Link>
                    ) : (
                      <HeroButton className="w-full justify-center" href="/login">
                        Login
                      </HeroButton>
                    )
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      </motion.header>
      
      {/* Sync Progress Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              {!syncDone ? (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20">
                  <svg className="h-4 w-4 animate-spin text-emerald-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                </span>
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20">
                  <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
              <h3 className="text-base font-semibold text-white">
                {syncDone ? 'Audit Complete' : 'Audit Scan Running...'}
              </h3>
            </div>

            <div className="mb-4 max-h-48 space-y-1.5 overflow-y-auto rounded-lg bg-black/30 p-3">
              {syncMessages.map((msg, i) => (
                <p key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                  <span className="mt-0.5 text-emerald-400">›</span>
                  {msg}
                </p>
              ))}
              {!syncDone && (
                <p className="flex items-center gap-1.5 text-xs text-zinc-500 animate-pulse">
                  <span className="text-emerald-500">›</span> Working...
                </p>
              )}
            </div>

            {syncDone && (
              <>
                <p className="mb-4 text-sm text-zinc-300">{syncSummary}</p>
                <button
                  onClick={handleSyncClose}
                  className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
                >
                  Close &amp; Refresh
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
