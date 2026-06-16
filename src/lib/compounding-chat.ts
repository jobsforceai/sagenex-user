export type ChatStep = 0 | 1 | 2;

export type ChatRole = "bot" | "user";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
};

export function parseCompoundingAmount(value: string) {
  const normalized = value.toLowerCase().replace(/,/g, "").replace(/₹/g, "").trim();
  const match = normalized.match(/[\d.]+/);
  if (!match) return null;
  const base = Number(match[0]);
  if (!Number.isFinite(base) || base <= 0) return null;
  if (normalized.includes("cr")) return base * 10000000;
  if (normalized.includes("lakh") || normalized.includes("lac") || /\d\s*l\b/.test(normalized)) return base * 100000;
  if (normalized.includes("k")) return base * 1000;
  return base;
}

export function parseProjectionMonths(value: string) {
  const normalized = value.toLowerCase().trim();
  const leadingNumber = normalized.match(/^\D*(\d+(?:\.\d+)?)/);

  if (leadingNumber) {
    const duration = Number(leadingNumber[1]);
    if (duration === 5) return 60;
    if (duration === 3) return 36;
    if (duration === 2) return 24;
    if (duration === 1) return 12;
    return null;
  }

  const words = new Set(normalized.match(/[a-z]+/g) ?? []);
  if (words.has("five")) return 60;
  if (words.has("three")) return 36;
  if (words.has("two")) return 24;
  if (words.has("one")) return 12;
  return null;
}
