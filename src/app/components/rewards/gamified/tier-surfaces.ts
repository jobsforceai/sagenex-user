/** Visual surface class per quest id (Pinterest-style pin headers) */
export const TIER_SURFACES: Record<string, string> = {
  "10L": "rewards-tier-rose",
  "30L": "rewards-tier-wine",
  "50L": "rewards-tier-slate",
  "1CR": "rewards-tier-gold",
  "europe-trip-2026": "rewards-tier-sky",
  "cruise-trip-2026": "rewards-tier-sea",
};

export function getTierSurface(id: string, type: "luxury" | "travel") {
  return TIER_SURFACES[id] ?? (type === "luxury" ? "rewards-tier-rose" : "rewards-tier-sky");
}
