"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";

function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1200;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        start = target;
        clearInterval(timer);
      }
      setValue(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);

  return <span ref={ref}>{value.toLocaleString("en-IN")}{suffix}</span>;
}

const STATS = [
  { value: 7000, suffix: "+", label: "Global Investors", color: "text-[var(--crimson)]" },
  { value: 16, suffix: " yrs", label: "Of Legacy", color: "text-[var(--emerald)]" },
];

export default function AboutSection() {
  return (
    <section id="about" className="landing-section-light w-full py-16 sm:py-20 md:py-28 relative overflow-hidden">
      {/* Subtle orb */}
      <div className="pointer-events-none absolute -right-[15%] top-[10%] h-[45vw] w-[45vw] rounded-full bg-[radial-gradient(circle,rgba(200,16,62,0.05)_0%,transparent_65%)]" />

      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 gap-10 items-center lg:grid-cols-2 lg:gap-16">

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="landing-eyebrow mb-4">Our Legacy</p>
            <h2 className="landing-headline mb-6">
              Trust is built by <span className="text-[var(--emerald)]">structure.</span>
            </h2>
            <blockquote className="mb-6 border-l-2 border-[var(--crimson)]/30 pl-4 text-[var(--landing-text-muted)] text-base sm:text-lg italic leading-relaxed">
              &quot;Trust is not built by promises. It is built by structure, discipline, and time.&quot;
              <cite className="block mt-1 not-italic text-sm font-semibold text-[var(--landing-text-dark)]">— Monish Adari, Founder & CEO</cite>
            </blockquote>
            <p className="text-[var(--landing-text-muted)] leading-relaxed text-[15px]">
              At Sagenex, we prioritize sustainability over shortcuts. Our ecosystem is protected by strict caps, diverse real-world asset backing, and a structured growth model designed to endure market volatility.
            </p>
          </motion.div>

          {/* Stats grid */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="grid grid-cols-2 gap-3 sm:gap-4"
          >
            {STATS.map((stat) => (
              <div key={stat.label} className="landing-card flex flex-col items-center justify-center text-center py-8 sm:py-10">
                <h3 className={`font-display text-3xl sm:text-4xl font-black mb-1.5 ${stat.color}`}>
                  <AnimatedNumber target={stat.value} suffix={stat.suffix} />
                </h3>
                <p className="text-[var(--landing-text-muted)] font-semibold text-xs sm:text-sm tracking-wide uppercase">{stat.label}</p>
              </div>
            ))}

            {/* Certified card — full width */}
            <div className="landing-card col-span-2 relative overflow-hidden flex flex-col items-center justify-center text-center py-8 sm:py-10 bg-gradient-to-br from-amber-50 via-white to-orange-50 border-amber-200/50">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(217,119,6,0.06),transparent_50%)] pointer-events-none" />
              <h3 className="relative font-display text-2xl sm:text-3xl font-black text-amber-700 mb-2">
                Certified
              </h3>
              <p className="relative text-amber-800/70 font-semibold text-sm">Physical Gold Bullion Reserves</p>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
