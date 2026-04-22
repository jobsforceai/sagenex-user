"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import Sidebar from "./Sidebar";

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
          className="rounded-lg p-2 text-zinc-500 hover:bg-[#f5f5f5]"
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
          className="absolute right-2 top-2 z-10 rounded-lg p-2 text-zinc-500 hover:bg-[#f5f5f5]"
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

      {/* Main content area */}
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 min-w-0">
        {children}
      </main>
    </div>
  );
}
