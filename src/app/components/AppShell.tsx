"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, LogOut, MoreHorizontal, X } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import Sidebar, { NAV_ITEMS } from "./Sidebar";

interface AppShellProps {
  children: React.ReactNode;
  balance?: number;
  userName?: string;
  userRank?: string;
  avatarUrl?: string;
}

export default function AppShell({
  children,
  balance,
  userName,
  userRank,
  avatarUrl,
}: AppShellProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const pathname = usePathname();
  const { logout } = useAuth();
  const primaryMobileHrefs = ["/dashboard", "/wallet", "/team", "/rewards"];
  const mobileNavItems = NAV_ITEMS.filter(({ href }) =>
    primaryMobileHrefs.includes(href)
  );
  const moreNavItems = NAV_ITEMS.filter(({ href }) => !primaryMobileHrefs.includes(href));
  const isMobileMoreActive = !mobileNavItems.some(
    ({ href }) => pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`))
  );
  const formattedBalance =
    balance !== undefined
      ? balance.toLocaleString("en-IN", {
          style: "currency",
          currency: "INR",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })
      : null;

  const handleLogout = () => {
    setMoreOpen(false);
    logout();
  };

  return (
    <div className="flex min-h-screen bg-[#f8f9fa]">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar
          balance={balance}
          userName={userName}
          userRank={userRank}
          avatarUrl={avatarUrl}
        />
      </div>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b border-[#e8e8e8] bg-white px-4 md:hidden">
        <div className="min-w-0">
          <span className="block text-sm font-black tracking-widest text-[#C41E3A]">SAGENEX</span>
          {userName && (
            <span className="block max-w-[190px] truncate text-[11px] font-medium text-slate-500">
              {userName}
            </span>
          )}
        </div>
        {formattedBalance && (
          <div className="rounded-full bg-[#FFF0F2] px-3 py-1 text-xs font-black text-[#C41E3A]">
            {formattedBalance}
          </div>
        )}
      </div>

      {/* Mobile more menu */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 md:hidden"
          onClick={() => setMoreOpen(false)}
        />
      )}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 transform rounded-t-3xl border-t border-[#e8e8e8] bg-white px-4 pb-[calc(env(safe-area-inset-bottom)+92px)] pt-3 shadow-[0_-20px_50px_rgba(15,23,42,0.18)] transition-transform duration-200 md:hidden ${
          moreOpen ? "translate-y-0" : "translate-y-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="More navigation"
      >
        <div className="mx-auto mb-3 h-1 w-11 rounded-full bg-slate-200" />
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-slate-950">{userName || "Sagenex"}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {userRank && (
                <span className="rounded-full bg-[#C41E3A10] px-2 py-0.5 text-[10px] font-bold text-[#C41E3A]">
                  {userRank}
                </span>
              )}
              {formattedBalance && (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  {formattedBalance}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setMoreOpen(false)}
            className="shrink-0 rounded-full p-2 text-slate-500 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/25"
            aria-label="Close more navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="grid max-h-[52vh] gap-1 overflow-y-auto pb-2" aria-label="More mobile navigation">
          {moreNavItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMoreOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-12 items-center gap-3 rounded-2xl px-3 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/25 ${
                  active
                    ? "bg-[#C41E3A] text-white shadow-[0_10px_22px_rgba(196,30,58,0.18)]"
                    : "text-slate-600 hover:bg-[#FFF1F4] hover:text-[#C41E3A]"
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${active ? "text-white" : "text-slate-400"}`} />
                <span className="min-w-0 flex-1 truncate">{label}</span>
                <ChevronRight className={`h-4 w-4 shrink-0 ${active ? "text-white/80" : "text-slate-300"}`} />
              </Link>
            );
          })}
        </nav>

        <button
          onClick={handleLogout}
          className="mt-3 flex min-h-12 w-full items-center gap-3 rounded-2xl border border-[#e8e8e8] px-3 text-sm font-bold text-slate-500 transition hover:bg-[#FFF1F4] hover:text-[#C41E3A] focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/25"
        >
          <LogOut className="h-5 w-5 shrink-0 text-slate-400" />
          Logout
        </button>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/80 bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] backdrop-blur md:hidden"
        aria-label="Primary mobile navigation"
      >
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {mobileNavItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center rounded-2xl px-1 text-[10px] font-black transition focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/25 ${
                  active
                    ? "bg-[#C41E3A] text-white shadow-[0_10px_22px_rgba(196,30,58,0.25)]"
                    : "text-slate-500 hover:bg-[#FFF1F4] hover:text-[#C41E3A]"
                }`}
              >
                <Icon className={`mb-1 h-5 w-5 ${active ? "text-white" : "text-slate-500"}`} />
                <span className="max-w-full truncate">{label === "Dashboard" ? "Home" : label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-label="Open more navigation"
            aria-expanded={moreOpen}
            className={`flex min-h-14 flex-col items-center justify-center rounded-2xl px-1 text-[10px] font-black transition focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/25 ${
              isMobileMoreActive
                ? "bg-[#C41E3A] text-white shadow-[0_10px_22px_rgba(196,30,58,0.25)]"
                : "text-slate-500 hover:bg-[#FFF1F4] hover:text-[#C41E3A]"
            }`}
          >
            <MoreHorizontal className={`mb-1 h-5 w-5 ${isMobileMoreActive ? "text-white" : "text-slate-500"}`} />
            <span>More</span>
          </button>
        </div>
      </nav>

      {/* Main content area */}
      <main className="min-w-0 flex-1 pb-24 pt-14 md:ml-60 md:pb-0 md:pt-0">
        {children}
      </main>
    </div>
  );
}
