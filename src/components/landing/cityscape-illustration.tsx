"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Glow-pulse dots overlaid on the city at approximate building-top
 * positions in the SVG's 1280 × 800 coordinate space.
 */
const PULSES = [
  { cx: 648,  cy: 308, delay: 0.0, r: 5  },
  { cx: 455,  cy: 372, delay: 0.7, r: 4  },
  { cx: 832,  cy: 288, delay: 1.3, r: 5  },
  { cx: 338,  cy: 390, delay: 1.9, r: 3  },
  { cx: 964,  cy: 322, delay: 0.4, r: 4  },
  { cx: 722,  cy: 335, delay: 1.0, r: 4  },
  { cx: 556,  cy: 325, delay: 0.6, r: 3  },
  { cx: 1060, cy: 408, delay: 1.6, r: 3  },
  { cx: 780,  cy: 362, delay: 0.9, r: 4  },
  { cx: 500,  cy: 340, delay: 1.2, r: 3  },
];

/**
 * Tiny "floating leaf / spark" particles that drift upward
 * from different x-positions across the city.
 */
const PARTICLES = [
  { x: 340,  startY: 420, delay: 0.0 },
  { x: 520,  startY: 390, delay: 0.8 },
  { x: 640,  startY: 350, delay: 1.6 },
  { x: 780,  startY: 400, delay: 0.4 },
  { x: 920,  startY: 370, delay: 1.2 },
  { x: 1060, startY: 430, delay: 2.0 },
];

export default function CityscapeIllustration() {
  const wrapperRef  = useRef<HTMLDivElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);
  const floatRef    = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Continuous float — bobs the inner city up/down like Groww
    gsap.to(floatRef.current, {
      y: -20,
      duration: 3.8,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    // Scroll parallax — city moves at 80 % of scroll speed (slower = depth)
    gsap.to(parallaxRef.current, {
      yPercent: -14,
      ease: "none",
      scrollTrigger: {
        trigger: wrapperRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: 1.4,
      },
    });
  }, { scope: wrapperRef });

  return (
    <div
      ref={wrapperRef}
      className="relative w-full overflow-hidden"
      style={{ height: 400 }}
      aria-hidden
    >
      {/* Parallax container */}
      <div ref={parallaxRef} className="absolute inset-0 will-change-transform">
        {/* Float container */}
        <div ref={floatRef} className="relative w-full h-full will-change-transform">

          {/* ── Base SVG illustration ── */}
          {/* No colour filter — the natural mint-green palette already matches the brand */}
          <Image
            src="/cityScape.svg"
            alt=""
            fill
            className="object-cover object-center select-none"
            priority
            sizes="100vw"
          />

          {/* ── Overlay SVG with animated elements ── */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 1280 800"
            preserveAspectRatio="xMidYMid slice"
          >
            {/* Glow pulses at building tops */}
            {PULSES.map((p, i) => (
              <motion.circle
                key={`pulse-${i}`}
                cx={p.cx}
                cy={p.cy}
                r={p.r}
                fill="#00b386"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.15, 0.85, 0.15], r: [p.r * 0.7, p.r * 1.9, p.r * 0.7] }}
                transition={{
                  duration: 2.6,
                  repeat: Infinity,
                  delay: p.delay,
                  ease: "easeInOut",
                }}
              />
            ))}

            {/* Rising spark particles */}
            {PARTICLES.map((pt, i) => (
              <motion.circle
                key={`particle-${i}`}
                cx={pt.x}
                r={2}
                fill="#00b386"
                initial={{ cy: pt.startY, opacity: 0 }}
                animate={{
                  cy: [pt.startY, pt.startY - 80, pt.startY - 160],
                  opacity: [0, 0.7, 0],
                }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  delay: pt.delay,
                  ease: "easeOut",
                  repeatDelay: 1,
                }}
              />
            ))}
          </svg>
        </div>
      </div>

      {/* Bottom white gradient — blends city into the section below */}
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none"
        style={{
          height: "55%",
          background: "linear-gradient(to top, #ffffff 0%, rgba(255,255,255,0.85) 40%, transparent 100%)",
        }}
      />

      {/* Top white gradient — softens the top edge */}
      <div
        className="absolute inset-x-0 top-0 pointer-events-none"
        style={{
          height: "12%",
          background: "linear-gradient(to bottom, #ffffff 0%, transparent 100%)",
        }}
      />
    </div>
  );
}
