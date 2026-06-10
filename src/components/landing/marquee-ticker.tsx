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
  const doubled = [...ITEMS, ...ITEMS, ...ITEMS];

  return (
    <div className="landing-fade-mask landing-section-light w-full py-4 sm:py-5 overflow-hidden border-y border-[var(--landing-border-light)] relative z-10">
      <div className="animate-marquee">
        {doubled.map((item, i) => (
          <div key={i} className="flex items-center gap-3 mx-5 sm:mx-8 shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--crimson)] shrink-0" />
            <span className="text-[13px] sm:text-[14px] font-bold text-[var(--landing-text-dark)] whitespace-nowrap tracking-wide font-display">
              {item.name}
            </span>
            <span className="text-[10px] sm:text-[11px] font-bold text-[var(--emerald)] whitespace-nowrap tracking-wider uppercase bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              {item.tag}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
