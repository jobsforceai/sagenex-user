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
  // Duplicate for seamless loop
  const doubled = [...ITEMS, ...ITEMS];

  return (
    <section className="w-full bg-[#f7f8fa] border-y border-[#e8e8e8] py-4 overflow-hidden">
      <div className="animate-marquee">
        {doubled.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-3 mx-8 flex-shrink-0"
          >
            <span className="h-2 w-2 rounded-full bg-[#00b386] flex-shrink-0" />
            <span className="text-sm font-semibold text-[#1a1a1a] whitespace-nowrap">
              {item.name}
            </span>
            <span className="text-xs text-[#888] whitespace-nowrap bg-[#e6f7f3] px-2 py-0.5 rounded-full">
              {item.tag}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
