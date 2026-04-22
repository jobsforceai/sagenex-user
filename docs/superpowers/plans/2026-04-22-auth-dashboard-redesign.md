# Auth & Dashboard Redesign — Clean Pro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dark-themed dashboard + centered auth card with a Clean Pro light layout: fixed left sidebar navigation, split-screen login, and unified crimson+emerald design tokens.

**Architecture:** New `Sidebar.tsx` + `AppShell.tsx` components wrap all authenticated pages. Dashboard removes `<Navbar>` and restructures its grid. Login gets a split-screen wrapper (crimson left panel, white right panel) with restyled inputs/buttons. No auth logic or sub-components are touched.

**Tech Stack:** Next.js 16 App Router, React ("use client"), Tailwind CSS v4, Lucide icons, next/navigation `usePathname`

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/app/components/Sidebar.tsx` | Fixed left nav: logo, user strip, 10-route nav, balance pill, logout |
| Create | `src/app/components/AppShell.tsx` | Flex wrapper: Sidebar + `<main ml-60>`, mobile hamburger drawer |
| Modify | `src/app/dashboard/page.tsx` | Remove Navbar, wrap content with AppShell, restyle header + quick-action cards |
| Modify | `src/app/login/page.tsx` | Split-screen outer wrapper, restyle all inputs/buttons |

---

## Task 1: Create `Sidebar.tsx`

**Files:**
- Create: `src/app/components/Sidebar.tsx`

- [ ] **Step 1: Write the Sidebar component**

```tsx
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
  Gem,
  BookOpen,
  ShieldCheck,
  User,
  LogOut,
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

  const formattedBalance = balance !== undefined
    ? balance.toLocaleString("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0, maximumFractionDigits: 0 })
    : null;

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-[#e8e8e8] bg-white">
      {/* Top: Logo */}
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-[#e8e8e8] px-4">
        <Image src="/sagenex.png" alt="Sagenex" width={32} height={32} className="h-8 w-8 object-contain" />
        <span className="text-sm font-black tracking-widest text-[#C41E3A]">SAGENEX</span>
      </div>

      {/* User strip */}
      {userName && (
        <div className="flex items-center gap-3 border-b border-[#e8e8e8] px-4 py-3">
          {avatarUrl ? (
            <Image src={avatarUrl} alt={userName} width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#C41E3A10] text-[#C41E3A] text-sm font-bold">
              {userName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#0a0a0a]">{userName}</p>
            {userRank && (
              <span className="inline-block rounded-full bg-[#C41E3A10] px-2 py-0.5 text-[10px] font-medium text-[#C41E3A]">
                {userRank}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex h-10 items-center gap-3 px-4 text-sm transition-colors duration-150 rounded-r-lg mr-2 ${
                active
                  ? "border-l-[3px] border-[#C41E3A] bg-[#C41E3A08] font-medium text-[#C41E3A]"
                  : "text-zinc-500 hover:bg-[#f5f5f5]"
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${active ? "opacity-100" : "opacity-70"}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: balance + logout */}
      <div className="shrink-0 border-t border-[#e8e8e8] p-4 space-y-3">
        {formattedBalance !== null && (
          <div className="rounded-xl border border-[#e8e8e8] bg-white px-4 py-2.5">
            <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">Available Balance</p>
            <p className="text-base font-bold text-[#00b386]">{formattedBalance}</p>
          </div>
        )}
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-zinc-500 transition-colors hover:bg-[#f5f5f5] hover:text-[#C41E3A]"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Verify the file was created**

```bash
ls src/app/components/Sidebar.tsx
```
Expected: file exists with no import errors visible.

- [ ] **Step 3: Commit**

```bash
git add src/app/components/Sidebar.tsx
git commit -m "feat: add Sidebar component with crimson active nav and balance pill"
```

---

## Task 2: Create `AppShell.tsx`

**Files:**
- Create: `src/app/components/AppShell.tsx`

- [ ] **Step 1: Write the AppShell component**

```tsx
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

export default function AppShell({ children, balance, userName, userRank, avatarUrl }: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#f8f9fa]">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar balance={balance} userName={userName} userRank={userRank} avatarUrl={avatarUrl} />
      </div>

      {/* Mobile: top bar + drawer */}
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

      {/* Mobile drawer backdrop */}
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
        <div className="absolute right-2 top-2">
          <button
            onClick={() => setDrawerOpen(false)}
            className="rounded-lg p-2 text-zinc-500 hover:bg-[#f5f5f5]"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <Sidebar balance={balance} userName={userName} userRank={userRank} avatarUrl={avatarUrl} />
      </div>

      {/* Main content */}
      <main className="flex-1 md:ml-60 pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Verify the file was created**

```bash
ls src/app/components/AppShell.tsx
```

- [ ] **Step 3: Commit**

```bash
git add src/app/components/AppShell.tsx
git commit -m "feat: add AppShell layout with responsive mobile drawer"
```

---

## Task 3: Update `dashboard/page.tsx`

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Add AppShell import and remove Navbar import**

In [src/app/dashboard/page.tsx](src/app/dashboard/page.tsx), find and replace:

```tsx
import Navbar from "@/app/components/Navbar";
```

Replace with:

```tsx
import AppShell from "@/app/components/AppShell";
```

- [ ] **Step 2: Replace the return statement outer wrapper**

Find:
```tsx
  return (
    <div className="bg-black text-white min-h-screen">
      {showSetPasswordModal && <SetPasswordModal onPasswordSet={onPasswordSet} />}
      <DashboardUpdatesOverlay token={token} />
      <Navbar userLevel={currentRank?.name} />
      <main className="container mx-auto p-4 pt-24">
```

Replace with:
```tsx
  return (
    <AppShell
      balance={wallet?.availableBalance}
      userName={profile?.fullName}
      userRank={currentRank?.name}
      avatarUrl={profile?.profilePicture}
    >
      {showSetPasswordModal && <SetPasswordModal onPasswordSet={onPasswordSet} />}
      <DashboardUpdatesOverlay token={token} />
      <div className="p-6 space-y-6">
```

- [ ] **Step 3: Close the new wrapper — find the closing tags of `<main>` and the outer `<div>`**

Find (near end of return, after `SixLegTreeView` and its skeleton):
```tsx
            </div>

        </>
        )}
      </main>
    </div>
  );
```

Replace with:
```tsx
            </div>

        </>
        )}
      </div>
    </AppShell>
  );
```

- [ ] **Step 4: Restyle the loading/error states (remove dark colors)**

Find:
```tsx
          <div className="flex items-center justify-center py-24 text-white/70">
            Loading...
          </div>
        ) : showError ? (
          <div className="flex items-center justify-center py-24 text-white/70">
            Error: {error}
          </div>
```

Replace with:
```tsx
          <div className="flex items-center justify-center py-24 text-zinc-400">
            Loading...
          </div>
        ) : showError ? (
          <div className="flex items-center justify-center py-24 text-zinc-400">
            Error: {error}
          </div>
```

- [ ] **Step 5: Restyle the dashboard header**

Find:
```tsx
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold flex items-center">
                  <Crown className="mr-2 text-yellow-400" />
                  Sagenex Hub
                </h1>
                <p className="text-muted-foreground">
                  Welcome back, {profile?.fullName}!
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <p className="text-2xl font-bold">
                  {wallet?.availableBalance?.toLocaleString("en-IN", {
                    style: "currency",
                    currency: "INR",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
            </div>
```

Replace with:
```tsx
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-[#0a0a0a]">
                  Good morning, {profile?.fullName?.split(" ")[0]}
                </h1>
                <p className="text-sm text-zinc-500">
                  {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>
            </div>
```

- [ ] **Step 6: Restyle Quick Actions heading**

Find:
```tsx
          <h2 className="text-lg font-semibold text-white mb-3">Quick Actions</h2>
```

Replace with:
```tsx
          <h2 className="text-lg font-semibold text-[#0a0a0a] mb-3">Quick Actions</h2>
```

- [ ] **Step 7: Replace all 4 Quick Action cards with unified crimson style**

Find the entire quick actions grid (from `<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">` to its closing `</div>`):

```tsx
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/salary" className="group">
              <Card className="relative overflow-hidden bg-linear-to-br from-emerald-500/10 via-black/20 to-black border border-emerald-500/20 shadow-[0_10px_24px_rgba(0,0,0,0.35)] transition-all group-hover:-translate-y-0.5 group-hover:border-emerald-400/50 group-hover:shadow-[0_18px_40px_rgba(16,185,129,0.18)]">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-linear-to-r from-emerald-300 via-emerald-500 to-emerald-300" />
                <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-emerald-400/15 blur-2xl" />
                <CardHeader className="flex flex-row items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-500/20 text-emerald-200 flex items-center justify-center ring-1 ring-emerald-400/30">
                    <BadgeDollarSign className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Salary</CardTitle>
                    <p className="text-sm text-gray-400">Eligibility and monthly status</p>
                  </div>
                </CardHeader>
              </Card>
            </Link>
            <Link href="/rewards" className="group">
              <Card className="relative overflow-hidden bg-gradient-to-br from-amber-500/10 via-black/20 to-black border border-amber-400/20 shadow-[0_10px_24px_rgba(0,0,0,0.35)] transition-all group-hover:-translate-y-0.5 group-hover:border-amber-300/50 group-hover:shadow-[0_18px_40px_rgba(251,191,36,0.18)]">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-linear-to-br from-amber-300 via-amber-500 to-amber-300" />
                <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-amber-400/15 blur-2xl" />
                <CardHeader className="flex flex-row items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-amber-500/20 text-amber-200 flex items-center justify-center ring-1 ring-amber-400/30">
                    <Gift className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Rewards</CardTitle>
                    <p className="text-sm text-gray-400">Claim and manage rewards</p>
                  </div>
                </CardHeader>
              </Card>
            </Link>
            <Link href="/payouts" className="group">
              <Card className="relative overflow-hidden bg-gradient-to-br from-sky-500/10 via-black/20 to-black border border-sky-400/20 shadow-[0_10px_24px_rgba(0,0,0,0.35)] transition-all group-hover:-translate-y-0.5 group-hover:border-sky-300/50 group-hover:shadow-[0_18px_40px_rgba(56,189,248,0.18)]">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-linear-to-br from-sky-300 via-sky-500 to-sky-300" />
                <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-sky-400/15 blur-2xl" />
                <CardHeader className="flex flex-row items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-sky-500/20 text-sky-200 flex items-center justify-center ring-1 ring-sky-400/30">
                    <ArrowDownCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Payouts</CardTitle>
                    <p className="text-sm text-gray-400">Withdrawals and history</p>
                  </div>
                </CardHeader>
              </Card>
            </Link>
            <Link href="/sgnx-gold" className="group">
              <Card className="relative overflow-hidden bg-gradient-to-br from-amber-500/10 via-black/20 to-black border border-amber-500/20 shadow-[0_10px_24px_rgba(0,0,0,0.35)] transition-all group-hover:-translate-y-0.5 group-hover:border-amber-400/50 group-hover:shadow-[0_18px_40px_rgba(245,158,11,0.18)]">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-linear-to-r from-amber-300 via-amber-500 to-amber-300" />
                <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-amber-400/15 blur-2xl" />
                <CardHeader className="flex flex-row items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-amber-500/20 text-amber-200 flex items-center justify-center ring-1 ring-amber-400/30">
                    <Gem className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">SGNX Gold</CardTitle>
                    <p className="text-sm text-gray-400">Gold & cash investment plans</p>
                  </div>
                </CardHeader>
              </Card>
            </Link>
```

Replace with:
```tsx
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { href: "/salary", icon: BadgeDollarSign, label: "Salary", sub: "Eligibility & monthly status" },
              { href: "/rewards", icon: Gift, label: "Rewards", sub: "Claim and manage rewards" },
              { href: "/payouts", icon: ArrowDownCircle, label: "Payouts", sub: "Withdrawals and history" },
              { href: "/sgnx-gold", icon: Gem, label: "SGNX Gold", sub: "Gold & cash investment plans" },
            ].map(({ href, icon: Icon, label, sub }) => (
              <Link key={href} href={href} className="group">
                <div className="relative overflow-hidden rounded-2xl border border-[#e8e8e8] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-all group-hover:-translate-y-0.5 group-hover:shadow-[0_4px_16px_rgba(196,30,58,0.12)]">
                  <div className="h-1 bg-[#C41E3A]" />
                  <div className="p-4">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#C41E3A10]">
                      <Icon className="h-5 w-5 text-[#C41E3A]" />
                    </div>
                    <p className="text-sm font-semibold text-[#0a0a0a]">{label}</p>
                    <p className="text-xs text-zinc-500">{sub}</p>
                  </div>
                </div>
              </Link>
            ))}
```

- [ ] **Step 8: Restyle right-column cards (Ticket Balance, Earnings Cap) — replace dark card classes**

Find (Ticket Balance card):
```tsx
              <Card className="bg-[#0b0b0b] border border-amber-900/40 rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">
                    Ticket Balance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total tickets:</span>
                    <span className="font-semibold text-amber-200">
                      {ticketBalance.totalTickets}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total invested:</span>
                    <span className="font-semibold text-white">
                      {formatCurrency(ticketBalance.totalInvestedUSD)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Last calculated:</span>
                    <span>
                      {ticketBalance.lastCalculatedAt
                        ? new Date(ticketBalance.lastCalculatedAt).toLocaleString()
                        : "N/A"}
                    </span>
                  </div>
                </CardContent>
              </Card>
```

Replace with:
```tsx
              <Card className="bg-white border border-[#e8e8e8] rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-500">
                    Ticket Balance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Total tickets:</span>
                    <span className="font-semibold text-[#0a0a0a]">
                      {ticketBalance.totalTickets}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Total invested:</span>
                    <span className="font-semibold text-[#0a0a0a]">
                      {formatCurrency(ticketBalance.totalInvestedUSD)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-zinc-400">
                    <span>Last calculated:</span>
                    <span>
                      {ticketBalance.lastCalculatedAt
                        ? new Date(ticketBalance.lastCalculatedAt).toLocaleString()
                        : "N/A"}
                    </span>
                  </div>
                </CardContent>
              </Card>
```

- [ ] **Step 9: Restyle Earnings Cap card**

Find:
```tsx
              <Card className="bg-[#0b0b0b] border border-emerald-900/40 rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">
                    Earnings Cap
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Earnings cap:</span>
                    <span className="font-semibold text-white">
                      {formatCurrency(dashboardData?.wallet.earningsCapTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Earned so far:</span>
                    <span className="font-semibold text-white">
                      {formatCurrency(dashboardData?.wallet.earnedSinceBaseline)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-dashed border-gray-700 pt-2">
                    <span className="text-gray-400">Remaining:</span>
                    <span className="font-semibold text-emerald-300">
                      {formatCurrency(dashboardData?.wallet.remainingEarningsCap)}
                    </span>
                  </div>
                </CardContent>
              </Card>
```

Replace with:
```tsx
              <Card className="bg-white border border-[#e8e8e8] rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-500">
                    Earnings Cap
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Earnings cap:</span>
                    <span className="font-semibold text-[#0a0a0a]">
                      {formatCurrency(dashboardData?.wallet.earningsCapTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Earned so far:</span>
                    <span className="font-semibold text-[#0a0a0a]">
                      {formatCurrency(dashboardData?.wallet.earnedSinceBaseline)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-dashed border-[#e8e8e8] pt-2">
                    <span className="text-zinc-500">Remaining:</span>
                    <span className="font-semibold text-[#00b386]">
                      {formatCurrency(dashboardData?.wallet.remainingEarningsCap)}
                    </span>
                  </div>
                </CardContent>
              </Card>
```

- [ ] **Step 10: Remove unused Crown import (no longer used in header)**

Find at the top of dashboard/page.tsx:
```tsx
import {
  ArrowDownCircle,
  BadgeDollarSign,
  CalendarCheck,
  Crown,
  Gem,
  Gift,
} from "lucide-react";
```

Replace with:
```tsx
import {
  ArrowDownCircle,
  BadgeDollarSign,
  Gem,
  Gift,
} from "lucide-react";
```

- [ ] **Step 11: Check types**

```bash
pnpm check-types 2>&1 | head -40
```
Expected: no errors related to AppShell or Sidebar. Fix any type errors before committing.

- [ ] **Step 12: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: replace Navbar with AppShell sidebar in dashboard, unify card styles to crimson/light theme"
```

---

## Task 4: Update `login/page.tsx`

**Files:**
- Modify: `src/app/login/page.tsx`

- [ ] **Step 1: Replace outer return wrapper with split-screen layout**

Find:
```tsx
  return (
    <div className="auth-light-scope bg-linear-to-b from-[#f7fbfa] to-white text-zinc-900 min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white border-gray-200 shadow-2xl shadow-black/10">
        {renderView()}
      </Card>
    </div>
  );
```

Replace with:
```tsx
  return (
    <div className="flex min-h-screen">
      {/* Left panel — crimson, desktop only */}
      <div className="hidden md:flex w-1/2 flex-col items-center justify-center bg-[#C41E3A] px-12 text-white">
        <Image
          src="/sagenex.png"
          alt="Sagenex emblem"
          width={200}
          height={200}
          className="mb-8 h-auto"
          style={{ filter: "drop-shadow(0 0 40px rgba(255,255,255,0.3))" }}
        />
        <p className="mb-4 text-center text-2xl font-bold leading-snug">
          A Civilization of<br />Heritage &amp; Innovation
        </p>
        <p className="text-center text-sm text-white/70">
          KYC Compliant · AI-Powered · Structured Returns
        </p>
      </div>

      {/* Right panel — white */}
      <div className="flex w-full flex-col items-center justify-center bg-white px-8 py-12 md:w-1/2">
        <div className="w-full max-w-md">
          <Card className="border-[#e8e8e8] bg-white shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
            {renderView()}
          </Card>
        </div>
      </div>
    </div>
  );
```

- [ ] **Step 2: Restyle `renderView` — CardTitle + CardDescription**

Find:
```tsx
                <div className="space-y-1">
                    <CardTitle className="text-2xl font-bold tracking-tight">{title}</CardTitle>
                    <CardDescription className="text-gray-400">{description}</CardDescription>
                </div>
```

Replace with:
```tsx
                <div className="space-y-1">
                    <CardTitle className="text-2xl font-bold tracking-tight text-[#0a0a0a]">{title}</CardTitle>
                    <CardDescription className="text-zinc-500">{description}</CardDescription>
                </div>
```

- [ ] **Step 3: Replace all dark Input classNames with light crimson style**

Run a targeted replacement across all `<Input` usages — change every occurrence of:
```
className="bg-black border-gray-800 text-white pl-10"
```
to:
```
className="bg-white border-[#e8e8e8] text-[#0a0a0a] pl-10 focus:border-[#C41E3A] focus:ring-[#C41E3A]/20 rounded-xl"
```

Also replace:
```
className="bg-black border-gray-800 text-white text-center tracking-[0.5em] pl-10"
```
to:
```
className="bg-white border-[#e8e8e8] text-[#0a0a0a] text-center tracking-[0.5em] pl-10 focus:border-[#C41E3A] focus:ring-[#C41E3A]/20 rounded-xl"
```

- [ ] **Step 4: Replace all blue primary buttons with crimson**

Replace every occurrence of:
```
className="w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
```
with:
```
className="w-full flex items-center gap-2 bg-[#C41E3A] hover:bg-[#a81831] text-white rounded-xl shadow-[0_2px_12px_rgba(196,30,58,0.25)]"
```

- [ ] **Step 5: Restyle the Nominee Access secondary button**

Find:
```tsx
                      className="w-full flex items-center gap-2 border-gray-700 text-gray-200 hover:bg-gray-900"
```

Replace with:
```tsx
                      className="w-full flex items-center gap-2 border-[#e8e8e8] text-zinc-700 hover:bg-[#f5f5f5] rounded-xl"
```

- [ ] **Step 6: Restyle Back + Sign up link buttons**

Find:
```tsx
                        <Button variant="link" className="p-0 flex items-center gap-2" onClick={handleBack} disabled={isLoading}>
```
Replace with:
```tsx
                        <Button variant="link" className="p-0 flex items-center gap-2 text-[#C41E3A] hover:text-[#a81831]" onClick={handleBack} disabled={isLoading}>
```

Find:
```tsx
                        <Button variant="link" className="p-0" onClick={() => changeView("email-signup")} disabled={isLoading}>
```
Replace with:
```tsx
                        <Button variant="link" className="p-0 text-[#C41E3A] hover:text-[#a81831]" onClick={() => changeView("email-signup")} disabled={isLoading}>
```

- [ ] **Step 7: Restyle icon prefix colors**

All input icon prefixes currently use `text-gray-400` — this is fine for the light theme, no change needed.

All input error messages use `text-red-500` — keep as-is (crimson-adjacent, still correct).

- [ ] **Step 8: Check types**

```bash
pnpm check-types 2>&1 | head -40
```
Expected: no new type errors. Fix any before committing.

- [ ] **Step 9: Commit**

```bash
git add src/app/login/page.tsx
git commit -m "feat: redesign login page with crimson split-screen layout and light theme inputs"
```

---

## Task 5: Visual verification

- [ ] **Step 1: Start dev server**

```bash
pnpm dev
```

- [ ] **Step 2: Check auth page at http://localhost:3000/login**

Verify:
- Desktop: crimson left panel with emblem + tagline, white right panel with form card
- Mobile: single white column, no left panel
- Input focus ring is crimson
- All buttons crimson (not blue)
- Back / Sign up links are crimson text
- Blocked account notice still renders correctly

- [ ] **Step 3: Log in and check dashboard at http://localhost:3000/dashboard**

Verify:
- Desktop: fixed left sidebar (w-60, white bg) with logo, user strip, nav links, balance pill, logout
- Active route `/dashboard` shows crimson left border + tinted bg
- Main area has light gray `#f8f9fa` background
- Quick-action cards: white bg, crimson top strip, crimson icon circles, 4-col grid
- Ticket Balance + Earnings Cap cards: white bg, light borders
- Mobile: no sidebar visible, hamburger top bar shows, drawer slides in on tap

- [ ] **Step 4: Navigate to a few other routes (e.g., /wallet, /rewards)**

Verify:
- These pages don't have AppShell (expected — they still have Navbar or their own layout)
- Dashboard sidebar active indicator moves correctly when navigating back to /dashboard

- [ ] **Step 5: Final commit if any fixups were needed**

```bash
git add -p
git commit -m "fix: auth/dashboard visual fixups after verification"
```
