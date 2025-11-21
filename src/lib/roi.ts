export function getTieredROIRate(packageUSD: number): number {
    if (packageUSD >= 10000) return 0.16; // 16% (Crown)
    if (packageUSD >= 5000) return 0.14;  // 14% (Diamond)
    if (packageUSD >= 2000) return 0.12;  // 12% (Titanium)
    if (packageUSD >= 1000) return 0.10;  // 10% (Platinum)
    if (packageUSD >= 500) return 0.08;   // 8% (Gold)
    if (packageUSD >= 300) return 0.07;   // 7% (Silver - interpolated)
    if (packageUSD >= 100) return 0.06;   // 6% (Bronze)
    if (packageUSD >= 50) return 0.05;    // 5% (Starter)
    return 0; // No ROI for packages less than 50
  }
  