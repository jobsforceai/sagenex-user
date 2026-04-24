"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import {
  LayoutDashboard,
  Wallet,
  Users,
  Gift,
  ArrowDownCircle,
  BadgeDollarSign,
  Gem,
  BookOpen,
  ShieldCheck,
  User,
  LogOut,
  RefreshCw,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/wallet", icon: Wallet, label: "Wallet" },
  { href: "/team", icon: Users, label: "Team" },
  { href: "/rewards", icon: Gift, label: "Rewards" },
  { href: "/payouts", icon: ArrowDownCircle, label: "Payouts" },
  { href: "/salary", icon: BadgeDollarSign, label: "Salary" },
  { href: "/sgnx-gold", icon: Gem, label: "SGNX Gold" },
  { href: "/courses", icon: BookOpen, label: "Courses" },
  { href: "/kyc", icon: ShieldCheck, label: "KYC" },
  { href: "/profile", icon: User, label: "Profile" },
];

interface SidebarProps {
  balance?: number;
  userName?: string;
  userRank?: string;
  avatarUrl?: string;
}

export default function Sidebar({ balance, userName, userRank, avatarUrl }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  const [syncing, setSyncing] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncMessages, setSyncMessages] = useState<string[]>([]);
  const [syncDone, setSyncDone] = useState(false);
  const [syncSummary, setSyncSummary] = useState("");

  const handleSyncProfile = async () => {
    setSyncing(true);
    setShowSyncModal(true);
    setSyncMessages(["Connecting to audit service..."]);
    setSyncDone(false);
    setSyncSummary("");

    try {
      const token = document.cookie
        .split("; ")
        .find((r) => r.startsWith("authToken="))
        ?.split("=")[1];

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
      const res = await fetch(`${backendUrl}/api/v1/user/sync/stream`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok || !res.body) throw new Error("Failed to connect to sync service");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let currentEvent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n");
        buffer = parts.pop() ?? "";

        for (const line of parts) {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (currentEvent === "progress" && data.message) {
                setSyncMessages((prev) => [...prev, data.message]);
              } else if (currentEvent === "done") {
                setSyncDone(true);
                setSyncSummary(data.message ?? "Audit complete.");
              } else if (currentEvent === "error") {
                setSyncDone(true);
                setSyncSummary(data.message ?? "Something went wrong.");
              }
            } catch {}
            currentEvent = "";
          }
        }
      }
    } catch (error) {
      console.error("Sync failed:", error);
      setSyncMessages((prev) => [...prev, "Connection error. Please try again."]);
      setSyncDone(true);
      setSyncSummary("Sync failed. Please try again.");
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncClose = () => {
    setShowSyncModal(false);
    window.location.reload();
  };

  const formattedBalance =
    balance !== undefined
      ? balance.toLocaleString("en-IN", {
          style: "currency",
          currency: "INR",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })
      : null;

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-[#e8e8e8] bg-white">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-[#e8e8e8] px-5">
        <Image
          src="/sagenex.png"
          alt="Sagenex"
          width={32}
          height={32}
          className="h-8 w-8 object-contain"
        />
        <span className="text-sm font-black tracking-widest text-[#C41E3A]">SAGENEX</span>
      </div>

      {/* User strip */}
      {userName && (
        <div className="flex items-center gap-3 border-b border-[#e8e8e8] px-4 py-3.5">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={userName}
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover ring-2 ring-[#e8e8e8]"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#C41E3A10] text-[#C41E3A] text-sm font-bold">
              {userName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#0a0a0a]">{userName}</p>
            {userRank && (
              <span className="inline-block mt-0.5 rounded-full bg-[#C41E3A10] px-2 py-0.5 text-[10px] font-semibold text-[#C41E3A]">
                {userRank}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"));
          return (
            <Link
              key={href}
              href={href}
              className={`flex h-9 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors duration-150 ${
                active
                  ? "bg-[#C41E3A] text-white"
                  : "text-zinc-500 hover:bg-[#C41E3A08] hover:text-zinc-700"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${active ? "text-white" : "opacity-60"}`}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: balance + sync + logout */}
      <div className="shrink-0 border-t border-[#e8e8e8] p-4 space-y-2.5">
        {formattedBalance !== null && (
          <div className="rounded-xl bg-[#FFF0F2] px-4 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-[#C41E3A] opacity-70">
              Available Balance
            </p>
            <p className="mt-0.5 text-[18px] font-black text-[#C41E3A]">{formattedBalance}</p>
          </div>
        )}
        <button
          onClick={handleSyncProfile}
          disabled={syncing}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-[#f5f5f5] hover:text-[#0a0a0a] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing..." : "Sync Profile"}
        </button>
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-[#fff0f2] hover:text-[#C41E3A]"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>

      {/* Sync modal */}
      {showSyncModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
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
                {syncDone ? "Audit Complete" : "Audit Scan Running..."}
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
    </aside>
  );
}
