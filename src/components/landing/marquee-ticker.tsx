"use client";

const ITEMS = [
  { name: "SG Trading", tag: "Crypto" },
  { name: "SGChain", tag: "Blockchain" },
  { name: "SGGOLD", tag: "Gold Rewards" },
  { name: "SGBN", tag: "Business Network" },
  { name: "SGSE", tag: "Securities" },
  { name: "Forex Trading", tag: "Managed" },
  { name: "Gold Mining", tag: "Africa" },
  { name: "Real Estate", tag: "International" },
  { name: "Agriculture Yields", tag: "Non-correlated" },
  { name: "SG Travels Club", tag: "Lifestyle" },
];

export default function MarqueeTicker() {
  const doubled = [...ITEMS, ...ITEMS, ...ITEMS]; // Tripled to ensure smooth infinite scroll on wide screens

  return (
    <div className="w-full section-dark py-5 overflow-hidden border-y border-[var(--border-dark)] relative z-10">
      <div className="animate-marquee">
        {doubled.map((item, i) => (
          <div key={i} className="flex items-center gap-4 mx-8 shrink-0">
            <span className="h-2 w-2 rounded-full bg-[var(--crimson)] shrink-0" />
            <span className="text-[14px] font-semibold text-[var(--text-primary-dark)] whitespace-nowrap tracking-wide font-display">
              {item.name}
            </span>
            <span className="text-[11px] font-bold text-[var(--emerald)] whitespace-nowrap tracking-wider uppercase bg-[var(--emerald-glow)] px-2 py-0.5 rounded-full">
              {item.tag}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
