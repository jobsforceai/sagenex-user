# Auth & Dashboard Redesign — Clean Pro

**Date:** 2026-04-22  
**Scope:** `src/app/login/page.tsx`, `src/app/dashboard/page.tsx`, new `AppShell` layout component  
**Theme:** Light mode — Crimson (`#C41E3A`) primary, Emerald (`#00b386`) secondary

---

## Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--crimson` | `#C41E3A` | Active nav, primary buttons, accent icons, quick-action top strips |
| `--crimson-bg` | `#C41E3A08` | Active nav row background |
| `--emerald` | `#00b386` | Positive values, earnings, success states, blink progress |
| `--bg-app` | `#f8f9fa` | Main content area background |
| `--bg-sidebar` | `#ffffff` | Sidebar background |
| `--border` | `#e8e8e8` | Cards, inputs, dividers |
| `--text-primary` | `#0a0a0a` | Headings |
| `--text-muted` | `#71717a` | Labels, secondary text |

---

## 1. App Shell Layout

### New file: `src/app/components/AppShell.tsx`

A client component wrapping all authenticated pages. Replaces per-page `<Navbar>` usage inside the dashboard.

**Structure:**
```
<div class="flex min-h-screen">
  <Sidebar />                          // fixed left, w-60
  <main class="ml-60 flex-1 bg-[#f8f9fa]">
    {children}
  </main>
</div>
```

**Mobile:** Sidebar hidden by default, slide-in drawer triggered by hamburger in a `h-14` top bar.

### New file: `src/app/components/Sidebar.tsx`

Three zones:

**Top zone:**
- Sagenex logo: `/sagenex.png` emblem (32px) + "SAGENEX" wordmark in `text-[#C41E3A] font-black tracking-widest`
- User strip: avatar (40px circle), full name (`font-semibold text-sm`), rank badge (`bg-[#C41E3A10] text-[#C41E3A] text-xs rounded-full px-2`)

**Middle zone (scrollable nav):**
All routes as `<Link>` rows — `h-10 px-4 flex items-center gap-3 rounded-r-lg`:

| Route | Icon | Label |
|-------|------|-------|
| `/dashboard` | LayoutDashboard | Dashboard |
| `/wallet` | Wallet | Wallet |
| `/team` | Users | Team |
| `/rewards` | Gift | Rewards |
| `/payouts` | ArrowDownCircle | Payouts |
| `/salary` | BadgeDollarSign | Salary |
| `/sgnx-gold` | Gem | SGNX Gold |
| `/courses` | BookOpen | Courses |
| `/kyc` | ShieldCheck | KYC |
| `/profile` | User | Profile |

- **Inactive:** `text-zinc-500`, icon `opacity-70`
- **Active:** `border-l-[3px] border-[#C41E3A] text-[#C41E3A] bg-[#C41E3A08]`, icon full opacity
- **Hover:** `bg-[#f5f5f5]`, 150ms transition

**Bottom zone:**
- Available balance pill: white card, emerald amount (`font-bold text-[#00b386]`)
- Logout button: `text-zinc-500 hover:text-[#C41E3A]`

---

## 2. Dashboard Page

### File: `src/app/dashboard/page.tsx`

Remove `<Navbar>` — handled by `AppShell`. Remove `pt-24` offset. Add `AppShell` in `layout.tsx` or wrap at dashboard level.

**Layout: `p-6 space-y-6`**

### Top strip (full width)
```
<div class="flex justify-between items-center">
  <div>
    <h1>Good morning, {name}</h1>   // text-2xl font-bold
    <p>{date}</p>                    // text-sm text-zinc-500
  </div>
  <div class="text-right">
    <p>Available Balance</p>
    <p class="text-3xl font-black text-[#C41E3A]">${balance}</p>
  </div>
</div>
```

### AgentOverview (full width)
- White card, `rounded-2xl border border-[#e8e8e8]`
- Progress bar: crimson fill
- Rank badge: crimson accent

### Quick Actions (full width, 4-col grid)
Salary · Rewards · Payouts · SGNX Gold

Each card:
- White bg, `rounded-2xl border border-[#e8e8e8]`
- `h-1 bg-[#C41E3A]` top strip
- Icon in `w-10 h-10 rounded-full bg-[#C41E3A10]` with crimson icon
- Title `font-semibold text-sm`, subtitle `text-xs text-zinc-500`
- Replaces multi-color (emerald/amber/sky) scheme

### Main 2-col grid (`grid-cols-1 lg:grid-cols-3 gap-6`)

**Left col (span-2):**
1. EarningsSummary
2. Leaderboard
3. ReferralGrowthTools

**Right col:**
1. SmartUpdates
2. TicketBalance
3. WithdrawalLimit
4. EarningsCap
5. LockedBonuses

All cards: `bg-white rounded-2xl border border-[#e8e8e8] shadow-[0_1px_4px_rgba(0,0,0,0.06)]`

### Full-width bottom
- SixLegTreeView (team structure)

---

## 3. Auth Page

### File: `src/app/login/page.tsx`

**Split-screen layout (desktop):**

```
<div class="flex min-h-screen">
  <LeftPanel />    // w-1/2, hidden on mobile
  <RightPanel />   // w-full md:w-1/2
</div>
```

**Left panel** (`bg-[#C41E3A]`, `hidden md:flex flex-col items-center justify-center`):
- `/sagenex.png` emblem (200px) with `drop-shadow(0 0 40px rgba(255,255,255,0.3))`
- Tagline: `"A Civilization of Heritage & Innovation"` — white, `text-2xl font-bold`
- Trust badges row: "KYC Compliant · AI-Powered · Structured Returns" — `text-white/70 text-sm`

**Right panel** (white bg, centered content `max-w-md mx-auto px-8 py-12`):
- Logo `/logo5.png` (48px) at top center
- View title: `text-2xl font-bold text-[#0a0a0a]`
- Description: `text-sm text-zinc-500`

**Input styling** (all views):
- `bg-white border border-[#e8e8e8] rounded-xl pl-10 focus:border-[#C41E3A] focus:ring-[#C41E3A]/20`
- Icon prefix: `text-zinc-400`

**Button styling:**
- Primary: `bg-[#C41E3A] hover:bg-[#a81831] text-white rounded-xl shadow-[0_2px_12px_rgba(196,30,58,0.25)]`
- Secondary/outline: `border border-[#e8e8e8] text-zinc-700 hover:bg-[#f5f5f5] rounded-xl`
- Link buttons (Back, Sign up): `text-[#C41E3A] hover:text-[#a81831]`

**Face verification panel:**
- White border `border border-[#e8e8e8] rounded-2xl`
- Blink progress: emerald (`#00b386`)
- Error states: crimson bg tint

**Blocked account notice:** crimson variant (already red-tinted, keep)

---

## 4. Implementation Order

1. Create `Sidebar.tsx` + `AppShell.tsx`
2. Update `dashboard/page.tsx` — swap Navbar for AppShell, restyle content
3. Update `login/page.tsx` — split-screen layout, restyle all views
4. Update shared card/input styles for consistency

## 5. Files NOT Changed

- All existing dashboard sub-components (`AgentOverview`, `EarningsSummary`, etc.) — only their wrapper/container styling changes in `dashboard/page.tsx`
- Auth logic, form handlers, face verification logic — unchanged
- `Navbar.tsx` — unchanged (still used on landing pages)
- All other app routes — unchanged
