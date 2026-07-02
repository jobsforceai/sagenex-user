"use client";

export function VaultMedal({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      className={className}
      aria-hidden
    >
      <circle cx="60" cy="60" r="52" fill="url(#medalGlow)" opacity="0.35" />
      <circle cx="60" cy="58" r="38" fill="url(#medalGold)" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
      <path
        d="M42 78 L48 98 L60 92 L72 98 L78 78"
        fill="url(#ribbonL)"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="1"
      />
      <path
        d="M48 42 L60 34 L72 42 L68 56 L60 52 L52 56 Z"
        fill="white"
        fillOpacity="0.9"
      />
      <defs>
        <radialGradient id="medalGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFD6DE" />
          <stop offset="100%" stopColor="#C41E3A" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="medalGold" x1="30" y1="20" x2="90" y2="100">
          <stop offset="0%" stopColor="#FFE4E8" />
          <stop offset="50%" stopColor="#F4B4C4" />
          <stop offset="100%" stopColor="#C41E3A" />
        </linearGradient>
        <linearGradient id="ribbonL" x1="42" y1="78" x2="78" y2="98">
          <stop offset="0%" stopColor="#00b386" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function SparkleDots({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 80" className={className} aria-hidden>
      {[12, 48, 92, 140, 178].map((x, i) => (
        <circle
          key={x}
          cx={x}
          cy={20 + (i % 3) * 18}
          r={1.5 + (i % 2)}
          fill="white"
          opacity={0.25 + (i % 3) * 0.15}
        />
      ))}
    </svg>
  );
}

export function TierWatermark({ label, className = "" }: { label: string; className?: string }) {
  return (
    <span
      className={`pointer-events-none select-none font-display text-5xl font-black leading-none tracking-tighter opacity-[0.12] ${className}`}
      aria-hidden
    >
      {label}
    </span>
  );
}
