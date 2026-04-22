"use client";

import { useEffect, useRef } from "react";

/**
 * Cuberto-style cursor:
 *  • Small dot  — snaps instantly to the pointer
 *  • Larger ring — lerps toward the pointer (gives the "lag" feel)
 *  • Ring expands + turns green on interactive elements
 */
export default function CursorFollower() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringWrapRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only activate on devices with a precise pointer (mouse / trackpad)
    if (typeof window === "undefined") return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let mx = -200;
    let my = -200;
    let rx = -200;
    let ry = -200;
    let rafId: number;

    // Hide the default OS cursor
    document.documentElement.classList.add("custom-cursor");

    const onMouseMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };

    const onMouseOver = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      const isInteractive = !!el.closest("a, button, [role='button'], input, textarea, select, label, [data-cursor-hover]");
      ringRef.current?.classList.toggle("is-hovering", isInteractive);
    };

    const tick = () => {
      // Dot — follows exactly
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${mx - 3.5}px, ${my - 3.5}px)`;
      }

      // Ring — lerps toward cursor (0.1 = 10% of remaining gap per frame ≈ ~15 frames to close)
      rx += (mx - rx) * 0.1;
      ry += (my - ry) * 0.1;

      if (ringWrapRef.current) {
        ringWrapRef.current.style.transform = `translate(${rx}px, ${ry}px)`;
      }

      rafId = requestAnimationFrame(tick);
    };

    document.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("mouseover", onMouseOver, { passive: true });
    rafId = requestAnimationFrame(tick);

    return () => {
      document.documentElement.classList.remove("custom-cursor");
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseover", onMouseOver);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      {/* Dot */}
      <div ref={dotRef} className="cursor-dot" aria-hidden />

      {/* Ring (wrapper positions, inner handles visual transitions) */}
      <div ref={ringWrapRef} className="cursor-ring-wrap" aria-hidden>
        <div ref={ringRef} className="cursor-ring" />
      </div>
    </>
  );
}
