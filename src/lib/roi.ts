// ─── Dual ROI Plan (April 6–19, 2026) ──────────────────────────────────
export type RoiPlanType = 'old' | 'new';

const DUAL_ROI_START = new Date('2026-04-06T23:59:00+05:30');
const DUAL_ROI_END   = new Date('2026-04-19T23:59:00+05:30');

/** True when the user should see the Old/New ROI picker. */
export const isDualRoiWindowOpen = (now: Date = new Date()): boolean =>
  now >= DUAL_ROI_START && now <= DUAL_ROI_END;

/** True when every new deposit must use the new plan. */
export const isNewRoiOnly = (now: Date = new Date()): boolean =>
  now > DUAL_ROI_END;

/** New-plan tiered monthly ROI rate (INR thresholds — April 2026 Leaders Guide). */
export function getNewTieredROIRate(packageUSD: number): number {
  if (packageUSD >= 1000000) return 0.10; // Elite:    ₹10L+     → 10%
  if (packageUSD >= 500000)  return 0.08; // Advanced: ₹5L–₹10L  → 8%
  if (packageUSD >= 100000)  return 0.07; // Standard: ₹1L–₹5L   → 7%
  if (packageUSD >= 5000)    return 0.06; // Trail:    ₹5K–₹1L   → 6%
  return 0;
}

// Active new-plan referral bonus rates (April 19+ / PDF April 2026 Leaders Guide).
export const NEW_PLAN_DIRECT_BONUS_PCT = 0.12; // 12% to direct sponsor
export const NEW_PLAN_UNILEVEL_PCTS = [
  0.08,  // Level 1: 8%
  0.06,  // Level 2: 6%
  0.04,  // Level 3: 4%
  0.02,  // Level 4: 2%
  0.01,  // Level 5: 1%
  0.005, // Level 6: 0.5%
  0.005, // Level 7+: 0.5%
];

// ─── Legacy & Current ROI Rates (INR thresholds — post migration) ────────

/** Legacy monthly ROI rate (pre-Jan 2026 cycles). Thresholds in INR. */
export function getLegacyTieredROIRate(packageUSD: number): number {
  if (packageUSD >= 900000) return 0.16; // ₹9L+   → 16%
  if (packageUSD >= 450000) return 0.14; // ₹4.5L+ → 14%
  if (packageUSD >= 180000) return 0.12; // ₹1.8L+ → 12%
  if (packageUSD >= 90000)  return 0.10; // ₹90K+  → 10%
  if (packageUSD >= 45000)  return 0.08; // ₹45K+  → 8%
  if (packageUSD >= 9000)   return 0.06; // ₹9K+   → 6%
  if (packageUSD >= 4500)   return 0.05; // ₹4.5K+ → 5%
  return 0;
}

/** Current (old-plan) monthly ROI rate. Thresholds in INR. */
export function getTieredROIRate(packageUSD: number): number {
  if (packageUSD >= 900000) return 0.14; // ₹9L+   → 14%
  if (packageUSD >= 450000) return 0.12; // ₹4.5L+ → 12%
  if (packageUSD >= 180000) return 0.10; // ₹1.8L+ → 10%
  if (packageUSD >= 90000)  return 0.08; // ₹90K+  → 8%
  if (packageUSD >= 45000)  return 0.06; // ₹45K+  → 6%
  if (packageUSD >= 9000)   return 0.05; // ₹9K+   → 5%
  if (packageUSD >= 4500)   return 0.04; // ₹4.5K+ → 4%
  return 0;
}

// Legacy plan referral values (kept for reference/audits).
export const LEGACY_FIRST_DEPOSIT_DIRECT_BONUS_PCT = 0.10; // 10%
export const LEGACY_UNILEVEL_PCTS = [
  0.06, // Level 1: 6%
  0.05, // Level 2: 5%
  0.04, // Level 3: 4%
  0.03, // Level 4: 3%
  0.02, // Level 5: 2%
  0.01, // Level 6: 1%
];

// Current plan referral values.
export const FIRST_DEPOSIT_DIRECT_BONUS_PCT = 0.08; // 8%
export const UNILEVEL_PCTS = [
  0.05, // Level 1: 5%
  0.04, // Level 2: 4%
  0.03, // Level 3: 3%
  0.02, // Level 4: 2%
  0.01, // Level 5: 1%
  0.01, // Level 6: 1%
];

// ROI upline bonus (special monthly bonus) rates.
export const ROI_UPLINE_BONUS_PCTS = [
  0.01,   // Level 1 (Direct Sponsor): 1.0%
  0.005,  // Level 2: 0.5%
  0.0025, // Level 3: 0.25%
  0.0025, // Level 4: 0.25%
];
export const ROI_UPLINE_MIN_PACKAGE_USD = 100000; // ₹1L minimum (INR)

export function getLegacyReinvestmentBonusPct(depositCount: number): number {
  switch (depositCount) {
    case 1: return 0.08; // R1: 8%
    case 2: return 0.06; // R2: 6%
    case 3: return 0.05; // R3: 5%
    case 4: return 0.04; // R4: 4%
    case 5: return 0.03; // R5: 3%
    default: return 0.02; // R6+: 2%
  }
}

// Current reinvestment splits — 100% to direct sponsor only (no upline splits).
export const REINVESTMENT_UPLINE_PCTS = [
  [0.06], // R1: 6%
  [0.05], // R2: 5%
  [0.04], // R3: 4%
  [0.03], // R4: 3%
  [0.02], // R5: 2%
  [0.01], // R6+: 1%
];

export function getReinvestmentUplinePcts(depositCount: number): number[] {
  const cycle = Math.max(1, depositCount);
  const index = Math.min(cycle - 1, REINVESTMENT_UPLINE_PCTS.length - 1);
  return REINVESTMENT_UPLINE_PCTS[index];
}

export function getReinvestmentBonusPct(depositCount: number): number {
  return getReinvestmentUplinePcts(depositCount).reduce((total, pct) => total + pct, 0);
}
