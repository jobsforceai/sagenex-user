/**
 * Calculates the tiered monthly ROI rate based on the package value (legacy plan).
 * @param packageUSD The user's package investment in USD.
 * @returns The ROI rate as a decimal (e.g., 0.16 for 16%).
 */
export function getLegacyTieredROIRate(packageUSD: number): number {
  if (packageUSD >= 10000) return 0.16; // 16%
  if (packageUSD >= 5000) return 0.14; // 14%
  if (packageUSD >= 2000) return 0.12; // 12%
  if (packageUSD >= 1000) return 0.10; // 10%
  if (packageUSD >= 500) return 0.08; // 8%
  if (packageUSD >= 100) return 0.06; // 6%
  if (packageUSD >= 50) return 0.05; // 5%
  return 0; // No ROI for packages less than 50
}

/**
 * Calculates the tiered monthly ROI rate based on the package value (current plan).
 * @param packageUSD The user's package investment in USD.
 * @returns The ROI rate as a decimal (e.g., 0.14 for 14%).
 */
export function getTieredROIRate(packageUSD: number): number {
  if (packageUSD >= 10000) return 0.14; // 14%
  if (packageUSD >= 5000) return 0.12; // 12%
  if (packageUSD >= 2000) return 0.10; // 10%
  if (packageUSD >= 1000) return 0.08; // 8%
  if (packageUSD >= 500) return 0.06; // 6%
  if (packageUSD >= 100) return 0.05; // 5%
  if (packageUSD >= 50) return 0.04; // 4%
  return 0; // No ROI for packages less than 50
}

// Legacy plan values (kept for reference/audits).
export const LEGACY_FIRST_DEPOSIT_DIRECT_BONUS_PCT = 0.10; // 10%
export const LEGACY_UNILEVEL_PCTS = [
  0.06, // Level 1: 6%
  0.05, // Level 2: 5%
  0.04, // Level 3: 4%
  0.03, // Level 4: 3%
  0.02, // Level 5: 2%
  0.01, // Level 6: 1%
];

// Current plan values (use these for new payouts going forward).
export const FIRST_DEPOSIT_DIRECT_BONUS_PCT = 0.08; // 8%
export const UNILEVEL_PCTS = [
  0.05, // Level 1: 5%
  0.04, // Level 2: 4%
  0.03, // Level 3: 3%
  0.02, // Level 4: 2%
  0.01, // Level 5: 1%
  0.01, // Level 6: 1% (same rate for any levels beyond)
];

// ROI upline bonus (special monthly bonus) rates.
export const ROI_UPLINE_BONUS_PCTS = [
  0.01, // Level 1 (Direct Sponsor): 1.0%
  0.005, // Level 2: 0.5%
  0.0025, // Level 3: 0.25%
  0.0025, // Level 4: 0.25%
];
export const ROI_UPLINE_MIN_PACKAGE_USD = 1000;

/**
 * Calculates the tiered reinvestment bonus percentage based on prior deposits (legacy plan).
 * @param depositCount The number of VERIFIED deposits the user has already made.
 * @returns The bonus rate as a decimal (e.g., 0.08 for 8%).
 */
export function getLegacyReinvestmentBonusPct(depositCount: number): number {
  switch (depositCount) {
    case 1:
      return 0.08; // R1: 8%
    case 2:
      return 0.06; // R2: 6%
    case 3:
      return 0.05; // R3: 5%
    case 4:
      return 0.04; // R4: 4%
    case 5:
      return 0.03; // R5: 3%
    default:
      return 0.02; // R6 and onwards: 2%
  }
}

export const REINVESTMENT_UPLINE_PCTS = [
  // Pct order: L1=Direct Sponsor (no lock), L2=Parent's parent (Unilevel Level 1), L3=Unilevel Level 2, L4=Unilevel Level 3.
  [0.03, 0.015, 0.009, 0.006], // R1: 6.00%
  [0.025, 0.0125, 0.0075, 0.005], // R2: 5.00%
  [0.02, 0.01, 0.006, 0.004], // R3: 4.00%
  [0.015, 0.0075, 0.0045, 0.003], // R4: 3.00%
  [0.01, 0.005, 0.003, 0.002], // R5+: 2.00%
];

export function getReinvestmentUplinePcts(depositCount: number): number[] {
  const cycle = Math.max(1, depositCount);
  const index = cycle >= 5 ? 4 : cycle - 1;
  return REINVESTMENT_UPLINE_PCTS[index];
}

export function getReinvestmentBonusPct(depositCount: number): number {
  return getReinvestmentUplinePcts(depositCount).reduce((total, pct) => total + pct, 0);
}
