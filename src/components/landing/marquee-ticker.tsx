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
  const doubled = [...ITEMS, ...ITEMS];

  return (
    <div className="w-full bg-[#0a0a0a] py-4 overflow-hidden border-y border-[#1a1a1a]">
      <div className="animate-marquee">
        {doubled.map((item, i) => (
          <div key={i} className="flex items-center gap-4 mx-10 shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00b386] shrink-0" />
            <span className="text-[13px] font-semibold text-white/90 whitespace-nowrap tracking-wide">
              {item.name}
            </span>
            <span className="text-[11px] font-medium text-[#00b386]/80 whitespace-nowrap tracking-wider uppercase">
              {item.tag}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
