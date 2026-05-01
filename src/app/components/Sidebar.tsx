"use client";

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
  TrendingUp,
  Gem,
  BookOpen,
  ShieldCheck,
  User,
  LogOut,
} from "lucide-react";

export const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/wallet", icon: Wallet, label: "Wallet" },
  { href: "/team", icon: Users, label: "Team" },
  { href: "/team-business", icon: TrendingUp, label: "My Business" },
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
        <span className="text-sm font-black tracking-widest text-black">SAGENEX</span>
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

      {/* Bottom: balance + logout */}
      <div className="shrink-0 border-t border-[#e8e8e8] p-3 space-y-2.5">
        {formattedBalance !== null && (
          <div
            className="rounded-xl px-4 py-2.5 bg-no-repeat"
            style={{
              backgroundColor: "#FFF0F2",
              backgroundImage: "url('/dashboard/availbalance.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-[#C41E3A] opacity-70">
              Available Balance
            </p>
            <p className="mt-0.5 text-[18px] font-black text-[#C41E3A]">{formattedBalance}</p>
          </div>
        )}
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-[#fff0f2] hover:text-[#C41E3A]"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
