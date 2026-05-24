/**
 * <UserIdLabel /> — the single source of truth for rendering a user
 * identifier in the user-app UI.
 *
 * Display rules (per the team's spec):
 *   - No fancyId set         → just show the original userId.
 *   - fancyId is a number    → show fancyId only (no slash; numeric
 *                              fancyIds look like normal userIds, so
 *                              showing both would be noise).
 *   - fancyId is a name      → show fancyId BIG, original userId small
 *                              underneath with a "/" prefix.
 *   - variant="inline"       → compact form for tree nodes / ledger
 *                              entries — fancyId only, fallback userId.
 *
 * Pass the backend payload's `fancyId` field directly (null/undefined
 * are both fine — they degrade to the original userId).
 */
"use client";

import React from "react";

type Variant = "big" | "inline" | "fancy-only";

export interface UserIdLabelProps {
  userId: string;
  fancyId?: string | null;
  variant?: Variant;
  /** Optional Tailwind classes layered onto the wrapper. */
  className?: string;
  /** When true (default), uppercase the displayed value. */
  uppercase?: boolean;
}

function isNumericFancy(fancyId: string): boolean {
  // "u99999" → all digits after the leading u
  return /^u\d+$/i.test(fancyId);
}

/** Pretty-cased display form — first U capital, rest preserved. */
function pretty(id: string, uppercase: boolean): string {
  if (!id) return "";
  if (uppercase) return id.toUpperCase();
  return "U" + id.slice(1);
}

export function UserIdLabel({
  userId,
  fancyId,
  variant = "inline",
  className,
  uppercase = true,
}: UserIdLabelProps) {
  const hasFancy = !!fancyId && fancyId.trim() !== "";
  const fancyDisplay = hasFancy ? pretty(fancyId!, uppercase) : "";
  const userIdDisplay = pretty(userId, uppercase);

  // Case 1: no fancyId — just the original.
  if (!hasFancy) {
    return <span className={className}>{userIdDisplay}</span>;
  }

  // Case 2: fancyId is numeric — show only the fancyId, no slash/dual line.
  if (isNumericFancy(fancyId!)) {
    return <span className={className}>{fancyDisplay}</span>;
  }

  // Case 3: variant=fancy-only — always single line, fancyId only.
  if (variant === "fancy-only") {
    return <span className={className}>{fancyDisplay}</span>;
  }

  // Case 4: variant=inline — compact "Uname (/U13520)" on one line.
  if (variant === "inline") {
    return (
      <span className={className}>
        <span className="font-bold">{fancyDisplay}</span>
        <span className="ml-1 text-[0.85em] text-slate-400">/{userIdDisplay}</span>
      </span>
    );
  }

  // Case 5: variant=big — fancyId on its own line big, userId small below.
  return (
    <span className={`inline-flex flex-col leading-tight ${className ?? ""}`}>
      <span className="font-black">{fancyDisplay}</span>
      <span className="text-[0.7em] font-bold text-slate-400">/{userIdDisplay}</span>
    </span>
  );
}

export default UserIdLabel;
