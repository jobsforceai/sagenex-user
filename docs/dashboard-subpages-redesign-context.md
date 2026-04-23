# Dashboard + Sidebar Subpages Redesign Context

Date: 2026-04-22
Workspace: sagenex-user (Next.js App Router)
Primary scope: authenticated app experience under sidebar navigation.

## 1) Scope You Asked For

This document covers the full dashboard area and all sidebar-linked subpages:

- /dashboard
- /wallet
- /team
- /rewards
- /payouts
- /salary
- /sgnx-gold
- /courses
- /kyc
- /profile

Primary source files:

- src/app/components/AppShell.tsx
- src/app/components/Sidebar.tsx
- src/app/dashboard/page.tsx
- src/app/wallet/page.tsx
- src/app/team/page.tsx
- src/app/rewards/page.tsx
- src/app/payouts/page.tsx
- src/app/salary/page.tsx
- src/app/sgnx-gold/page.tsx
- src/app/courses/page.tsx
- src/app/kyc/page.tsx
- src/app/profile/page.tsx
- src/app/globals.css
- src/actions/user.ts
- src/actions/sgnxgold.ts

## 2) Current Authenticated Shell Architecture

### App shell

- AppShell is a client shell wrapping authenticated pages.
- Desktop: fixed left sidebar (width 240).
- Mobile: top bar + slide-in drawer.
- Main content region starts after sidebar offset.

Current shell structure:

- Left: Sidebar with logo, user strip, nav links, balance pill, logout.
- Right: page-specific content.

### Sidebar nav model (order is current IA)

1. Dashboard
2. Wallet
3. Team
4. Rewards
5. Payouts
6. Salary
7. SGNX Gold
8. Courses
9. KYC
10. Profile

### Global visual layer now in use

- Light app background: #f8f9fa.
- Sidebar background: white.
- Primary accent: #C41E3A.
- Positive accent: #00b386.
- Global class wrapper used for backward compatibility: dashboard-light-scope.

Important: several pages still contain legacy dark utility classes (gray-900, neutral-900, text-white, etc.), currently being visually normalized by global overrides in globals.css. For redesign, remove this dependency and use native light tokens directly in each component.

## 3) Data + API Contract (Server Actions)

All calls below are in src/actions/user.ts unless noted.

### Core dashboard domain

- getDashboardData -> GET /api/v1/user/dashboard + GET /api/v1/user/rank-progress (merged)
- getRankProgress -> GET /api/v1/user/rank-progress
- getReferralSummary -> GET /api/v1/user/team/summary
- getLeaderboard -> GET /api/v1/user/leaderboard
- getFinancialSummary -> GET /api/v1/user/financial-summary
- getTicketBalance -> GET /api/v1/user/tickets/me

### Wallet domain

- getWalletData -> GET /api/v1/user/wallet
- getWalletCurrentCycleHistory -> GET /api/v1/wallet/current-cycle-history
- requestWithdrawal -> POST /api/v1/wallet/request-withdrawal
- executeTransfer -> POST /api/v1/wallet/transfer/execute
- getTransferRecipients -> GET /api/v1/user/transfer-recipients

### Team domain

- getTeamTree -> GET /api/v1/user/team/tree
- getPlacementQueue -> GET /api/v1/user/team/placement-queue
- getBonusRulesConfig -> GET /api/v1/config/bonus-rules

### Rewards domain

- getRewards -> GET /api/v1/rewards
- getRewardPrograms -> GET /api/v1/rewards/programs
- transferReward -> POST /api/v1/rewards/:rewardId/transfer
- uploadRewardDocument -> POST /api/v1/rewards/:rewardId/documents/upload
- submitRewardDocuments -> POST /api/v1/rewards/:rewardId/documents/submit

### Payouts domain

- getPayouts -> GET /api/v1/user/payouts?page=&limit=
- getCurrentPayoutProgress -> GET /api/v1/user/payouts/current-progress

### Courses domain

- getAllCourses -> GET /api/v1/courses
- getCourseById -> GET /api/v1/courses/:courseId
- enrollInCourse -> POST /api/v1/courses/:courseId/enroll
- getCourseProgress -> GET /api/v1/courses/:courseId/progress

### KYC domain

- getKycStatus -> GET /api/v1/kyc/status
- uploadKycDocument -> POST /api/v1/kyc/document
- submitKycForReview -> POST /api/v1/kyc/submit-for-review

### Profile domain

- getProfileData -> GET /api/v1/user/profile
- updateUserProfile -> PATCH /api/v1/user/profile
- getNomineeStatus -> GET /api/v1/user/nominee
- setNomineePhrase -> POST /api/v1/user/nominee
- disableNomineeAccess -> DELETE /api/v1/user/nominee
- getBiometricsStatus -> GET /api/v1/user/biometrics/status

### SGNX Gold domain (src/actions/sgnxgold.ts)

- getMyEnrollments -> GET /api/v1/sgnxgold/my-enrollments
- getLiveGoldRate -> GET /api/v1/sgnxgold/gold-rate
- getLivePrices -> GET /api/v1/sgnxgold/prices/live
- getHistoricalPrices -> GET /api/v1/sgnxgold/prices/historical
- getCityPrices -> GET /api/v1/sgnxgold/prices/cities
- enrollFromWallet -> POST /api/v1/sgnxgold/enroll-from-wallet
- getSgnxGoldTree -> GET /api/v1/sgnxgold/my-tree?depth=6

## 4) Shared Data Entities Used in UI

- DashboardData
  - profile: fullName, profilePicture, referralCode, userId, earningsMultiplier fields
  - wallet: availableBalance, withdrawalCap, totalLifetimeWithdrawals, remainingWithdrawalLimit, earnings cap fields, bonuses
  - package: packageUSD
  - rank/performanceRank snapshots

- RankProgress
  - rank, performanceRank
  - salaryEligibility
  - progress requirements

- KycStatus
  - status: NOT_SUBMITTED | PENDING | VERIFIED | REJECTED
  - rejectionReason
  - documents list

## 5) Page-by-Page Functional Context

## /dashboard
File: src/app/dashboard/page.tsx

Purpose:
- Executive overview hub.
- Entry point for all key earning and network actions.

Data loaded:
- getDashboardData (core)
- getRankProgress
- getReferralSummary
- getLeaderboard
- getFinancialSummary
- getTicketBalance

Primary UI blocks:
- Welcome hero with balance and rank/progress snapshot.
- Quick actions cards to Salary/Rewards/Payouts/SGNX Gold.
- Earnings snapshot cards.
- Top performers list.
- Referral tools (copy link + stats).
- Wallet summary + ticket summary + multiplier window.

Key interactions:
- Copy referral link.
- Navigate to action pages.

States:
- Loading skeletons.
- Error panel.
- Warning alert for salary grace state.

## /wallet
File: src/app/wallet/page.tsx

Purpose:
- Monetary operations hub: overview, transfer, rewards balance view, transaction history.

Data loaded:
- getWalletData
- getDashboardData (for shell context)
- getKycStatus
- getWalletCurrentCycleHistory

Primary UI blocks:
- Header with KYC status and withdrawal limit badge.
- Tabs: Overview, SGChain transfer, Rewards, History.
- Drawers for withdrawal and transfer flows.
- Compounding projection modal.

Key interactions:
- Open withdrawal drawer.
- Open transfer drawer.
- Filter/view cycle snapshots and ledger.
- Jump between tabs.

States:
- Separate loading/error for wallet/dashboard/cycle/kyc.

## /team
File: src/app/team/page.tsx

Purpose:
- Team network management and visibility.

Data loaded:
- getTeamTree
- getPlacementQueue
- getBonusRulesConfig
- getDashboardData (for shell)

Primary UI blocks:
- Team header + Bonus Rules trigger.
- Placement queue widget.
- Tree visualization via TreeClient.
- Bonus rules modal with tabs:
  - First investment
  - Reinvestments

Key interactions:
- Open/close rules modal.
- Read payout rule matrices.

States:
- Auth/data loading.
- Error fallback.

## /rewards
File: src/app/rewards/page.tsx

Purpose:
- Travel reward qualification tracking and reward transfer/document submission.

Data loaded:
- getRewards
- getRewardPrograms
- getTransferRecipients
- getKycStatus
- getDashboardData (for shell)

Primary UI blocks:
- Travel showcase cards (Europe/Cruise campaign style).
- Program tracker with reward cards and status states.
- Transfer modal.
- Reward document modal.

Key interactions:
- Transfer reward to recipient.
- Upload required travel documents.
- Submit documents for review.

States:
- Reward claim status machine:
  - NONE, PENDING, COMPLETED, DOCUMENTS_REQUIRED, DOCUMENTS_PENDING
- Program lock handling.

Design note:
- Still heavily dark-themed internally (intentional current state + scoped light overrides).

## /payouts
File: src/app/payouts/page.tsx

Purpose:
- Current payout countdown + payout history + cap/schedule visibility.

Data loaded:
- getCurrentPayoutProgress
- getPayouts (paginated)
- getDashboardData (for shell)

Primary UI blocks:
- Stat card(s) for estimated payout.
- Countdown and cycle progress bar.
- Upcoming ROI schedule section.
- Payout history accordion/list with infinite scroll behavior.

Key interactions:
- Scroll to auto-load next payout pages.
- Expand monthly breakdowns.

States:
- Initial loading screen.
- History incremental loading.
- Cap reached conditional panel.

Design note:
- Uses many dark utility classes in cards/text.

## /salary
File: src/app/salary/page.tsx

Purpose:
- Rank progression and salary eligibility explanation page.

Data loaded:
- getRankProgress

Primary UI blocks:
- Current month performance card.
- Countdown to month close.
- Progress to next rank.
- Rank ladder cards and requirements.
- Leg details table.
- Achiever bonus explainer.
- Grace period and conditions cards.

Key interactions:
- Mostly informational; no transactional action except navigate back.

States:
- Loading skeleton screen.
- Error with retry.

Design note:
- Recently migrated to AppShell but still mostly dark class structure.

## /sgnx-gold
File: src/app/sgnx-gold/page.tsx

Purpose:
- Precious metal investment journey (portfolio + pricing + plan management + tree).

Data loaded:
- getMyEnrollments
- getLiveGoldRate
- getLivePrices (gold/silver)
- getCityPrices
- getDashboardData (for shell)

Primary UI blocks:
- Hero portfolio summary.
- Action buttons (start/new investment, history toggle).
- Live price cards + chart + city prices.
- Payment progress.
- Transaction history.
- SGNX referral tree visualization.
- Enrollment modal.

Key interactions:
- Open enroll modal.
- Toggle history.
- Switch metal context.

States:
- Independent loading for hero/prices/cities.

Design note:
- Component set is still dark aesthetic by default.

## /courses
File: src/app/courses/page.tsx

Purpose:
- Course catalog gating by package tier and access status.

Data loaded:
- getAllCourses
- getDashboardData (for shell)

Primary UI blocks:
- Academy cards with tier themes.
- Access overlays for locked tiers.
- Upgrade modal.

Key interactions:
- Open course modules when unlocked.
- Open upgrade modal when next_locked.
- Navigate to wallet to invest.

States:
- Loading skeleton cards.
- Error callout.
- Empty state.

Design note:
- Strong dark card language still present.

## /kyc
File: src/app/kyc/page.tsx

Purpose:
- Identity verification workflow with explicit stepper.

Data loaded:
- getKycStatus
- uploadKycDocument
- submitKycForReview

Primary UI blocks:
- Status display (pending/verified/rejected).
- 3-step upload flow:
  - Legal agreement
  - ID front
  - ID back
- File selection + upload controls.
- Final submit for review action.

Key interactions:
- Upload each document.
- Download legal agreement PDF.
- Submit full packet for admin review.

States:
- Loading screen.
- Rejected reason card.
- Per-doc upload state.
- Submit state.

Design note:
- Uses dark utility classes inside cards/stepper.

## /profile
File: src/app/profile/page.tsx

Purpose:
- User identity center + profile edit + nominee + biometrics + ticket summary.

Data loaded:
- getProfileData
- getKycStatus
- getNomineeStatus
- getBiometricsStatus
- getTicketBalance
- getDashboardData (for shell)
- updateUserProfile
- setNomineePhrase
- disableNomineeAccess

Primary UI blocks:
- Profile hero with avatar, status pills, KYC badge.
- Editable fields modal/panel.
- Referral code copy block.
- Nominee management panel.
- Biometrics status panel.
- Ticket and account summary cards.

Key interactions:
- Edit profile fields.
- Copy referral code.
- Set/disable nominee code.

States:
- Loading.
- Error.
- Success/error toasts/messages for updates.

Design note:
- Mixed visual language (new light header + legacy dark cards).

## 6) Existing Visual System + Technical Constraints

### Existing tokens in use

- Primary crimson: #C41E3A
- Positive emerald: #00b386
- App background: #f8f9fa
- Sidebar border/card border: #e8e8e8

### Global compatibility layer currently active

In globals.css under dashboard-light-scope:

- Overrides for old dark classes to render lighter surfaces.
- Utility text and border remapping.

Important for redesign team:
- Prefer replacing old dark classes in page components.
- Reduce dependence on global remapping to avoid side effects.

### Functional constraints

- App is client-rendered for these pages.
- Auth token from cookie; 401 redirects to /login at action layer.
- Data loaded mostly with Promise.all patterns.
- Several pages rely on dashboard payload for shell identity/balance context.

## 7) UX Gaps to Address in Redesign

- Inconsistent visual language across subpages (some pure light, many dark internals).
- Excessive vertical whitespace in certain sections.
- Modal and card styles vary significantly by page.
- Typography hierarchy differs across pages.
- Status badges and KPI cards are not standardized.

## 8) Recommended Unified Redesign Spec (for Stitch/Claude)

Apply this to every sidebar page:

- Single page container pattern:
  - outer: p-6
  - vertical rhythm: space-y-5 or space-y-6
- Unified card style:
  - bg white
  - border #e8e8e8
  - radius 16 or 20
  - soft shadow
- Unified section header pattern:
  - title size 24-30
  - subtitle muted gray
- Unified metric card pattern:
  - small uppercase label
  - bold value
  - optional trend/status icon
- Unified modal style:
  - white surface
  - consistent close button placement
  - 24px internal padding
- Unified table/list style:
  - alternating subtle surface rows
  - clear divider rhythm
- Mobile behavior:
  - preserve AppShell drawer nav
  - avoid horizontal scroll where possible

## 9) Copy-Paste Prompt for Design Tools

Use this prompt:

Redesign the authenticated dashboard suite of a Next.js app with a consistent light-only visual system. Routes in scope: /dashboard, /wallet, /team, /rewards, /payouts, /salary, /sgnx-gold, /courses, /kyc, /profile. Keep existing information architecture and data semantics, but unify layout, typography, spacing, cards, status chips, forms, tables, and modals. Use AppShell with fixed desktop sidebar and mobile drawer. Primary accent #C41E3A, positive accent #00b386, app background #f8f9fa, borders #e8e8e8. Build a reusable component language for KPI cards, section headers, tab strips, modals, and data tables. Remove legacy dark styling patterns and avoid large vertical whitespace gaps. Preserve all business workflows (wallet transfer/withdrawal, KYC upload flow, rewards transfer/documents, payout schedule/history, team bonus rules, salary progression, SGNX Gold enrollment and price tracking, profile edit and nominee controls).

## 10) Delivery Checklist for Final Redesign

- Every sidebar route uses same light card language.
- No dark root wrappers in dashboard subpages.
- No dependency on global dark-to-light class remapping.
- Spacing is compact and consistent.
- All existing actions and state transitions preserved.
- Desktop and mobile parity checked.
- Build + lint/typecheck clean.
