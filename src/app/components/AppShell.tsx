"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, MoreHorizontal, X } from "lucide-react";
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const mobileNavItems = NAV_ITEMS.filter(({ href }) =>
    ["/dashboard", "/wallet", "/team", "/rewards", "/salary"].includes(href)
  );
  const isMobileMoreActive = !mobileNavItems.some(
    ({ href }) => pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`))
  );

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
        <span className="text-sm font-black tracking-widest text-[#C41E3A]">SAGENEX</span>
        <button
          onClick={() => setDrawerOpen(true)}
          className="rounded-lg p-2 text-zinc-500 transition hover:bg-[#f5f5f5] focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/25"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-60 transform transition-transform duration-200 md:hidden ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setDrawerOpen(false)}
          className="absolute right-2 top-2 z-10 rounded-lg p-2 text-zinc-500 transition hover:bg-[#f5f5f5] focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/25"
          aria-label="Close navigation"
        >
          <X className="h-4 w-4" />
        </button>
        <Sidebar
          balance={balance}
          userName={userName}
          userRank={userRank}
          avatarUrl={avatarUrl}
        />
      </div>

      {/* Mobile bottom navigation */}
      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/80 bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] backdrop-blur md:hidden"
        aria-label="Primary mobile navigation"
      >
        <div className="mx-auto grid max-w-md grid-cols-6 gap-1">
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
            onClick={() => setDrawerOpen(true)}
            aria-label="Open more navigation"
            aria-expanded={drawerOpen}
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
