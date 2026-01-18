"use client";

import { RefObject } from "react";

interface FaceScanHeroProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  faceAligned: boolean;
  faceHint: string | null;
  mainInstruction: string | null;
  livenessStatus: "idle" | "running" | "passed";
  layout?: "full" | "contained";
}

export function FaceScanHero({
  videoRef,
  faceAligned,
  faceHint,
  mainInstruction,
  livenessStatus,
  layout = "full",
}: FaceScanHeroProps) {
  const isContained = layout === "contained";

  return (
    <div className="relative w-full overflow-hidden rounded-none lg:rounded-2xl border-0 lg:border lg:border-gray-800 bg-black/80">
      <div
        className={
          isContained
            ? "relative w-full h-[62vh] max-h-[520px] min-h-[320px]"
            : "relative w-full min-h-[100dvh] lg:min-h-0 lg:aspect-square"
        }
      >
        {/* Main instruction overlay */}
        {mainInstruction && (
          <div className="absolute left-0 right-0 top-1/3 lg:top-6 z-10 flex justify-center px-4">
            <div className="rounded-full border border-emerald-400/60 bg-black/80 px-6 py-3 backdrop-blur-sm">
              <p className="text-lg font-semibold text-emerald-100">
                {mainInstruction}
              </p>
            </div>
          </div>
        )}

        {/* Face alignment hint */}
        {faceHint && (
          <div
            className={`absolute right-3 top-3 z-10 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
              faceAligned
                ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-100 animate-pulse"
                : "border-amber-400/40 bg-amber-500/15 text-amber-100"
            }`}
          >
            {faceHint}
          </div>
        )}

        {/* Video element */}
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          playsInline
        />

        {/* Scan mask overlay */}
        <div className="pointer-events-none absolute inset-0 face-scan-mask" />

        {/* Oval guide - maintain circular shape */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className={`aspect-[5/6.5] w-[60%] max-h-[78%] rounded-[45%] border-2 transition-all duration-300 ${
              faceAligned
                ? "border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.8)] animate-[pulse_2s_ease-in-out_infinite]"
                : "border-emerald-400/40"
            }`}
          />
        </div>

        {/* Tick marks */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className={`aspect-[5/6.5] w-[70%] max-h-[90%] rounded-[45%] face-scan-ticks transition-opacity duration-300 ${
              faceAligned ? "face-scan-aligned opacity-100" : "opacity-60"
            }`}
          />
        </div>

        {/* Crosshair */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="relative aspect-[5/6.5] w-[60%] max-h-[78%] rounded-[45%] face-scan-crosshair">
            <div
              className={`absolute left-1/2 top-[6%] h-[88%] w-px -translate-x-1/2 transition-all duration-300 ${
                faceAligned
                  ? "bg-emerald-300 shadow-[0_0_16px_rgba(16,185,129,0.9)]"
                  : "bg-emerald-300/40"
              }`}
            />
            <div
              className={`absolute left-[6%] top-1/2 h-px w-[88%] -translate-y-1/2 transition-all duration-300 ${
                faceAligned
                  ? "bg-emerald-300 shadow-[0_0_16px_rgba(16,185,129,0.9)]"
                  : "bg-emerald-300/40"
              }`}
            />
          </div>
        </div>

        {/* Scanning sweep line */}
        {livenessStatus === "running" && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
            <div className="aspect-[5/6.5] w-[60%] max-h-[78%] rounded-[45%] relative overflow-hidden">
              <div className="absolute inset-x-0 h-0.5 bg-linear-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_20px_rgba(16,185,129,0.8)] animate-[scan_2s_ease-in-out_infinite]" />
            </div>
          </div>
        )}

        {/* Success checkmark */}
        {livenessStatus === "passed" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-full bg-emerald-500/20 p-4 border-2 border-emerald-400 animate-in zoom-in duration-500">
                <svg
                  className="h-16 w-16 text-emerald-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-xl font-semibold text-emerald-100">
                Verification Complete
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom instruction */}
      <div
        className={
          isContained
            ? "hidden"
            : "hidden lg:block px-4 pb-3 pt-2 text-center text-xs text-white/60"
        }
      >
        Keep your face inside the oval and follow the instructions
      </div>
    </div>
  );
}
