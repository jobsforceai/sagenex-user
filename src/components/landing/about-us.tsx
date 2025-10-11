// components/AboutUs.tsx
"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

type Milestone = {
  year: string;
  title: string;
  points: string[];
  t: number;
  align?: "left" | "right";
  // Optional manual position overrides per breakpoint. Values are pixels.
  // - labelOffsetX: horizontal offset applied to the year label relative to the dot x
  // - contentOffset: horizontal offset applied to the content block relative to the dot x
  // - absolute: { left, top } to place the content absolutely (overrides offsets)
  // Provide keys: desktop, tablet, mobile
  pos?: {
    desktop?: { labelOffsetX?: number; contentOffset?: number; absolute?: { left?: number; top?: number } };
    tablet?: { labelOffsetX?: number; contentOffset?: number; absolute?: { left?: number; top?: number } };
    mobile?: { labelOffsetX?: number; contentOffset?: number; absolute?: { left?: number; top?: number } };
  };
};

const MILESTONES: Milestone[] = [
  {
    year: "2025",
    title: "Official Launch",
    points: [
      "Official launch of SGX Coin.",
      "Rollout of SGX PMS.",
      "First 500K+ users.",
    ],
    t: 0.99,
    align: "left",
    pos: {
      desktop: { labelOffsetX: 10, contentOffset: 50 },
      tablet: { labelOffsetX: -30, contentOffset: -100 },
      mobile: { labelOffsetX: 24, contentOffset: 20 },
    },
  },
  {
    year: "2026",
    title: "Utility & Scale",
    points: ["1M+ community.", "SGX Debit Card.", "Staking & Yield pools."],
    t: 0.78,
    align: "right",
    pos: {
      desktop: { labelOffsetX: -78, contentOffset: 90 },
      tablet: { labelOffsetX: 12, contentOffset: 90 },
      mobile: { labelOffsetX: 8, contentOffset: 60 },
    },
  },
  {
    year: "2027",
    title: "Exchange & Commerce",
    points: [
      "SGX Exchange launch.",
      "SGX E-Commerce live.",
      "APAC market expansion.",
    ],
    t: 0.66,
    align: "left",
    pos: {
      desktop: { labelOffsetX: 14, contentOffset: 60 },
      tablet: { labelOffsetX: 12, contentOffset: 90 },
      mobile: { labelOffsetX: 8, contentOffset: -240 },
    },
  },
  {
    year: "2028",
    title: "RWA & Alliances",
    points: ["5M+ members.", "RWA tokenization.", "FinTech alliances."],
    t: 0.54,
    align: "right",
    pos: {
      desktop: { labelOffsetX: 54, contentOffset: 150 },
      tablet: { labelOffsetX: 12, contentOffset: 90 },
      mobile: { labelOffsetX: 8, contentOffset: 60 },
    },
  },
  {
    year: "2029",
    title: "Global Listings",
    points: [
      "International listings.",
      "Top 25 recognition.",
      "Expanded compliance.",
    ],
    t: 0.18,
    align: "right",
    pos: {
      desktop: { labelOffsetX: 44, contentOffset: 170 },
      tablet: { labelOffsetX: 12, contentOffset: 90 },
      mobile: { labelOffsetX: 8, contentOffset: -250 },
    },
  },
  {
    year: "2030",
    title: "Powerhouse",
    points: ["15M+ members.", "Smart Wealth City.", "IPO ambitions."],
    t: 0.01,
    align: "left",
    pos: {
      desktop: { labelOffsetX: 14, contentOffset: 60 },
      tablet: { labelOffsetX: 12, contentOffset: 90 },
      mobile: { labelOffsetX: 8, contentOffset: -220 },
    },
  },
];

const CLEAN_D = `M28.8101 963C26.8096 919.211 31.7885 897.868 42 860.5 53.9111 831.307 61.0104 815.215 93.5 799.5S146.099 772.878 180 770.5 250.688 762.316 306.5 770.5 384.595 777.693 431.565 757.5 474 736 495 726.5 521.5967 712.4887 534.895 705.483C548.1933 698.4773 552.8997 685.803 561.902 675.963 569 664 567.3813 660.619 570.121 652.947 572.445 641.53 570.31 635.428 561.902 624.928 554.455 615.949 556.29 617.246 534.895 603.413 513.5 589.58 482 584 463 577S407 558 388.5 570 372 591 388 598 419 608 432 609 446 610 459 609 477 605 495 600 506 595 518 590C523 584 521 580 509 571 496 564 491 564 463.746 553.88c-24.072-10.007-56.95-18.513-95.699-31.021C329.298 510.35 320.585 507.403 286.44 501.344 258.657 495.163 238.884 495.34 212.464 489.836 186.045 484.332 167.736 484.652 139.076 481.33 111.773 480.052 95.8246 479.374 68.0364 473.825 49.3603 467.667 33.1613 463.882 21.068 443.804 8.9747 423.726 7.9268 422.219 6.3904 407.279 4.854 392.339 8.0276 374.256 12.8486 360.747 17.6696 347.237 20.8559 340.409 32.8102 330.226 54.2102 318.484 66.8623 313.214 87.411 307.21 107.9601 301.206 114.2291 299.69 133.2051 295.201 157.2931 292.749 171.2651 289.232 196.0251 283.693 217.8641 279.271 230.0011 276.413 250.6261 267.682 270.2721 257.034 279.1331 250.361 286.4401 233.159 293.912 216.33 292.5 203.5 297 184.5 302.779 162.64 304.589 159.105 309.447 144.596 314.891 132.535 318.166 125.818 327.647 114.575 337.725 103.685 344.02 98.3413 356.415 92.0598 369.234 85.1455 390.467 78.0501 390.467 78.0501S407.017 73.5491 421.584 74.0473C434.933 75.6045 442.216 77.0158 451.526 89.5581 454.89 96.7292 455.491 100.845 451.526 108.571 446.572 117.028 440.338 118.844 428.629 121.58 411.921 125.899 402.025 125.141 384.009 121.58 367.317 119.082 358.273 114.072 342.324 103.067 334.538 96.0849 331.022 90.3714 327.647 74.0473L306.5 1`;

export default function AboutUs() {
  const HEIGHT = 1100;
  const rootRef = useRef<HTMLElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const dotRefs = useRef<HTMLSpanElement[]>([]);
  const labelRefs = useRef<HTMLSpanElement[]>([]);
  const cardRefs = useRef<HTMLElement[]>([]);

  useEffect(() => {
    const svg = svgRef.current;
    const path = pathRef.current;
    const overlay = overlayRef.current;
    if (!svg || !path || !overlay) return;

    const total = path.getTotalLength();
    const from = -total;
    const to = 0;

    [path].forEach((p) => {
      if (!p) return;
      p.style.strokeDasharray = `${total}`;
      p.style.strokeDashoffset = `${from}`;
      gsap.fromTo(
        p,
        { strokeDashoffset: from },
        {
          strokeDashoffset: to,
          ease: "none",
          scrollTrigger: {
            trigger: overlay,
            start: "top 80%",
            end: "bottom 20%",
            scrub: true,
            // markers: true
          },
        }
      );
    });

    const toOverlayXY = (L: number) => {
      const svgPoint = svg?.createSVGPoint() as DOMPoint;
      const p = path.getPointAtLength(L);
      svgPoint.x = p.x;
      svgPoint.y = p.y;
      const screen = svgPoint.matrixTransform(path.getScreenCTM()!);
      const ob = overlay.getBoundingClientRect();
      return { x: screen.x - ob.left, y: screen.y - ob.top };
    };

    const place = () => {
      const gutter =
        Math.min(window.innerWidth, 1440) < 768
          ? 16
          : Math.min(window.innerWidth * 0.03, 28);
      const width = window.innerWidth;
      const bp: "desktop" | "tablet" | "mobile" = width >= 1024 ? "desktop" : width >= 640 ? "tablet" : "mobile";
      MILESTONES.forEach((m, i) => {
        const { x, y } = toOverlayXY(m.t * total);
        const dot = dotRefs.current[i];
        const card = cardRefs.current[i];
        const label = labelRefs.current[i];
        if (dot) {
          dot.style.left = `${x}px`;
          dot.style.top = `${y}px`;
        }
        if (label) {
          // apply manual pos overrides if available for this breakpoint
          const posOverride = m.pos?.[bp];
          if (posOverride?.absolute) {
            if (typeof posOverride.absolute.left === "number") {
              label.style.left = `${posOverride.absolute.left}px`;
            } else {
              const labelOffsetX = typeof posOverride.labelOffsetX === "number" ? posOverride.labelOffsetX : (m.align === "right" ? 12 : -36);
              label.style.left = `${x + labelOffsetX}px`;
            }
            if (typeof posOverride.absolute.top === "number") {
              label.style.top = `${posOverride.absolute.top}px`;
            } else {
              label.style.top = `${y - 8}px`;
            }
          } else {
            const labelOffsetX = typeof posOverride?.labelOffsetX === "number" ? posOverride!.labelOffsetX : (m.align === "right" ? 12 : -36);
            label.style.left = `${x + labelOffsetX}px`;
            label.style.top = `${y - 8}px`;
          }
        }
        if (card) {
          card.style.top = `${y}px`;
          // manual pos override for content
          const posOverride = m.pos?.[bp];
          if (posOverride?.absolute) {
            if (typeof posOverride.absolute.left === "number") {
              card.style.left = `${posOverride.absolute.left}px`;
            } else {
              const contentOffset = typeof posOverride.contentOffset === "number" ? (x + posOverride.contentOffset) : (m.align === "right" ? x + gutter + 36 : x - gutter - 36);
              card.style.left = `${contentOffset}px`;
            }
            if (typeof posOverride.absolute.top === "number") {
              card.style.top = `${posOverride.absolute.top}px`;
            }
          } else {
            const contentOffset = typeof posOverride?.contentOffset === "number" ? (m.align === "right" ? x + posOverride.contentOffset : x - posOverride.contentOffset) : (m.align === "right" ? x + gutter + 36 : x - gutter - 36);
            card.style.left = `${contentOffset}px`;
          }
          card.style.transform = m.align === "right" ? "translate(0,-50%)" : "translate(-100%,-50%)";
        }
      });
      ScrollTrigger.refresh();
    };

    place();
    window.addEventListener("resize", place);

    // GSAP reveal animations for the section elements when scrolled into view
    // Scoped to this component using gsap.context for safe cleanup
    const ctx = gsap.context(() => {
      const sel = gsap.utils.selector(rootRef.current as HTMLElement);

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play none none reverse",
          // markers: true,
        },
      });

      tl.from(sel('.about-hero-title'), {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
      });

      tl.from(
        sel('.about-hero-copy'),
        { y: 20, opacity: 0, duration: 0.6, stagger: 0.15, ease: 'power2.out' },
        '-=0.5'
      );

      tl.from(sel('.about-pledge'), {
        y: 18,
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out',
      }, '-=0.5');

      // Labels (year) and content blocks animations
      tl.from(labelRefs.current, {
        x: -6,
        opacity: 0,
        duration: 0.6,
        stagger: 0.08,
        ease: 'back.out(1.4)'
      }, '-=0.5');

      tl.from(cardRefs.current, {
        y: 20,
        opacity: 0,
        duration: 0.7,
        stagger: 0.12,
        ease: 'power2.out'
      }, '-=0.55');
    }, rootRef.current ?? undefined);

    return () => {
      window.removeEventListener("resize", place);
      ctx.revert();
    };
  }, []);

  return (
    <section ref={rootRef} className="relative overflow-hidden bg-black text-white">
      {/* golden glow blobs (decorative) */}
      {/* <div
        aria-hidden
        className="pointer-events-none absolute z-0 left-[-6%] top-0 w-[420px] h-[420px] rounded-full"
        style={{
          background:
            'radial-gradient(closest-side, rgba(255,244,204,0.9), rgba(255,215,64,0.35), rgba(255,200,60,0.12), transparent 60%)',
          filter: 'blur(60px)',
          transform: 'translate3d(0,0,0)'
        }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute z-0 right-[-8%] bottom-0 w-[560px] h-[560px] rounded-full"
        style={{
          background:
            'radial-gradient(closest-side, rgba(255,239,196,0.85), rgba(255,216,119,0.28), rgba(255,190,60,0.08), transparent 65%)',
          filter: 'blur(90px)',
          mixBlendMode: 'screen',
        }}
      /> */}
      {/* ---------- TOP HERO (added) ---------- */}
      <div id="about-us" className="mx-auto max-w-6xl px-6 pt-20 md:pt-28 relative z-10">
        <h1
          className="about-hero-title text-[clamp(56px,7vw,128px)] leading-[0.9] font-extrabold tracking-tight
                     text-transparent bg-clip-text bg-gradient-to-b from-emerald-200 to-white"
        >
          about us
        </h1>

        <p className="mt-6 max-w-4xl text-center md:text-right md:ml-auto text-[17px]  text-white/85">
          <span className="about-hero-copy">
            We are{" "}
            <span className="font-semibold text-emerald-300">SAGENEX</span>, a
            global wealth ecosystem that fuses blockchain innovation, real-world
            assets, and community power to create
          </span>
          <span className="about-hero-copy">
            {" "}
            unstoppable growth. Our journey started with a strategic investment
            in Jobsforce.ai, a Silicon Valley-recognized AI venture. That move
            gave us access to world-class tech, talent insights, and predictive
            market strategies — and positioned us as serious players on the
            global stage.
          </span>
        </p>

        <div className="mt-10 text-center">
          <div className="text-lg tracking-wide text-white/80">
            based in{" "}
            <span className="font-semibold text-emerald-300">USA</span>
          </div>
          <div className="mx-auto mt-3 h-8 w-px bg-white" />
        </div>

        {/* Centered pledge + right microcopy block */}
        <div className="mt-8 flex flex-col items-end gap-6">
          <p className="about-pledge px-4 text-center md:text-center uppercase tracking-[0.18em] text-[16px] leading-relaxed text-white/90">
            AT SAGENEX, WE ARE MORE THAN A TEAM — WE ARE A FAMILY. EVERY
            CAMPAIGN WE CREATE, EVERY MESSAGE WE SHARE, AND EVERY MILESTONE WE
            ACHIEVE IS BUILT ON TRUST, UNITY, AND THE BELIEF THAT TOGETHER WE
            ARE UNSTOPPABLE.
          </p>

          <p className="about-hero-copy text-[14px] w-[40%] leading-4 text-white/70 md:text-right text-center">
            At <span className="font-semibold text-emerald-300">SAGENEX</span>,
            we are more than a team — we are a family. every campaign we create,
            every message we share, and every milestone we achieve is built on
            trust, unity, and the belief that together we are unstoppable.
          </p>
        </div>
      </div>

      {/* ---------- /TOP HERO ---------- */}

      {/* ---------- TIMELINE (unchanged positioning/alignment) ---------- */}
      <div className="relative w-full md:mt-36" style={{ height: HEIGHT }}>
        <svg
          ref={svgRef}
          className="absolute inset-0 w-full h-full"
          viewBox="6 1 565 962"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="35%" stopColor="#F0F0F0" />
              <stop offset="70%" stopColor="#D3D3D3" />
              <stop offset="100%" stopColor="#A9A9A9" />
            </linearGradient>
            <filter id="blur10" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" />
            </filter>
            <linearGradient id="glowGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#bbf7d0" />
              <stop offset="35%" stopColor="#86efac" />
              <stop offset="70%" stopColor="#4ade80" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
          </defs>

          <path
            id="glow"
            d={CLEAN_D}
            fill="none"
            stroke="url(#glowGradient)"
            strokeWidth="28"
            opacity="0.35"
            filter="url(#blur10)"
            vectorEffect="non-scaling-stroke"
          />

          <path
            ref={pathRef}
            d={CLEAN_D}
            fill="none"
            stroke="url(#gold)"
            strokeWidth="6"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        <div ref={overlayRef} className="absolute inset-0">
          {MILESTONES.map((m, i) => (
            <div key={m.year}>
              <span
                ref={(el) => {
                  if (el) {
                    dotRefs.current[i] = el;
                  }
                }}
                className="milestone-dot absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  width: 16,
                  height: 16,
                  background:
                    "radial-gradient(circle at 30% 30%, #fff 0%, #ffd36b 35%, #dc9e2e 70%, #0000 71%)",
                  boxShadow:
                    "0 0 0 4px rgba(255, 211, 107, 0.15), 0 0 18px 4px rgba(255, 200, 64, 0.25)",
                }}
              />

              {/* year label beside the dot */}
              <span
                ref={(el) => {
                  if (el) {
                    labelRefs.current[i] = el;
                  }
                }}
                className="absolute text-sm font-semibold text-white/90"
                aria-hidden
              >
                ({m.year})
              </span>

              {/* simple text content positioned further from the dot */}
              <div
                ref={(el) => {
                  if (el) {
                    cardRefs.current[i] = el;
                  }
                }}
                className={[
                  "absolute text-sm text-white/80 leading-6 max-w-xs",
                  m.align === "right" ? "origin-left text-left" : "origin-right text-right",
                ].join(" ")}
              >
                <div className="scale-75 sm:scale-100 font-medium text-white/90">{m.title}</div>
                <div className="mt-1 scale-75 sm:scale-100 text-[13px]">
                  {m.points.join(" — ")}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* ---------- /TIMELINE ---------- */}

      <div className="pointer-events-none h-20 w-full bg-gradient-to-b from-transparent to-[#0d0711]" />
    </section>
  );
}
