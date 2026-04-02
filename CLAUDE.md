# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

See also: `../CLAUDE.md` for monorepo-wide context (backend, other frontends).

## Commands

```bash
pnpm dev          # next dev --turbopack (port 3000)
pnpm build        # next build --webpack
pnpm lint         # eslint (flat config: next/core-web-vitals + next/typescript)
pnpm check-types  # tsc --noEmit
```

No test runner is configured.

## Architecture

This is the **user-facing** Next.js 16 App Router app for the Sagenex platform. It is entirely client-rendered behind auth — there is no Next.js middleware file; route protection is handled by the AuthContext and Server Actions.

### Two API call paths

1. **Server Actions** (`src/actions/auth.ts`, `src/actions/user.ts`) — used for most data fetching. They read the `authToken` cookie via `next/headers`, attach `Authorization: Bearer` headers, and call the backend directly at `NEXT_PUBLIC_BACKEND_URL`. On 401, `user.ts` actions redirect to `/login`; `auth.ts` actions do not redirect (caller handles it).

2. **Client-side `api` helper** (`src/lib/api.ts`) — a thin fetch wrapper that reads `authToken` from `document.cookie`. Used in some client components. Throws on non-OK responses (error has `.status` and `.data`).

Both paths hit the same backend. The `next.config.ts` rewrites `/api/:path*` to the backend, but most code calls the backend URL directly rather than using the rewrite.

### Auth flow

- **AuthContext** (`src/app/context/AuthContext.tsx`) — client-side provider wrapping the entire app. Stores JWT in an httpOnly-ish cookie (`authToken`) + user object in localStorage. Provides `login()`, `logout()`, `replaceSession()`, `bootstrapImpersonationSession()`.
- Login methods: Google OAuth (`@react-oauth/google`), email+OTP, email+password, nominee login, impersonation login (admin → user).
- Face verification via face-api.js + TensorFlow.js for liveness detection (models served from `/public/models/face-api`).

### Provider hierarchy (root layout)

`GoogleOAuthProvider` → `AuthProvider` → `NextThemesProvider` (dark default) → children + `ChatbotWidget` + `Toaster` (sonner)

### Component organization

- `src/components/ui/` — shadcn/ui (New York style, neutral base, Lucide icons). Add via `npx shadcn@latest add <component>`.
- `src/components/{common,landing,tests,wallet}/` — shared feature components.
- `src/app/components/` — page-specific components organized by domain (`biometrics/`, `dashboard/`, `courses/`, `kyc/`, `rewards/`, `salary/`, `wallet/`, `expenses/`).
- `src/app/components/biometrics/` — face verification UI (LivenessPanel, FaceVerificationPanel, DeviceSheet, etc.).

### Key libraries

- **Visualization**: Recharts (charts), React Flow + Dagre (referral tree in `src/lib/utils.tsx`), jsPDF (PDF generation)
- **Animation**: Framer Motion, GSAP + ScrollTrigger
- **Forms**: react-hook-form + Zod (`src/lib/validation.ts` has transfer and test booking schemas)
- **Business logic constants**: `src/lib/roi.ts` (tiered ROI rate tables), `src/lib/bonuses.ts` (unilevel bonus definitions)

### Route structure

All pages are flat under `src/app/` — no nested layouts beyond the root. Key routes: `/login`, `/dashboard`, `/wallet`, `/team`, `/rewards`, `/courses/[courseId]`, `/tests/book`, `/tests/online`, `/kyc`, `/profile`, `/payouts`, `/salary`, `/expenses/[ticketId]`, `/lottery`, `/sgbn`, `/sgse`.

### Types

- `src/types.ts` — shared domain types (UserNode, KycStatus, CourseSummary, etc.)
- `src/types/tests.ts` — test catalog types

## Environment Variables

- `NEXT_PUBLIC_BACKEND_URL` — backend base URL (default: `http://localhost:8080`)
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` — Google OAuth client ID (required)
- `AUTOPROCTOR_ORIGIN` — allowed frame ancestor for `/tests/online` and `/login` CSP headers
