"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const LIVENESS_STEPS = ["center", "left", "right"] as const;

interface LivenessPanelProps {
  livenessStatus: "idle" | "running" | "passed";
  livenessStepIndex: number;
  livenessProgress?: number;
  yawDeg: number | null;
  modelsReady: boolean;
  cameraReady: boolean;
  onStartLiveness: () => void;
}

export function LivenessPanel({
  livenessStatus,
  livenessStepIndex,
  livenessProgress = 0,
  yawDeg,
  modelsReady,
  cameraReady,
  onStartLiveness,
}: LivenessPanelProps) {
  const canStart = modelsReady && cameraReady && livenessStatus === "idle";
  const currentStep = LIVENESS_STEPS[livenessStepIndex];

  return (
    <>
      {/* Mobile: Compact floating card at bottom */}
      <div className="lg:hidden p-4 pb-6">
        {/* Step indicators - only show when running or passed */}
        {livenessStatus !== "idle" && (
          <div className="mb-3 flex justify-center items-center gap-1.5">
            {LIVENESS_STEPS.map((step, index) => {
              const isComplete = livenessStepIndex > index;
              const isCurrent = livenessStepIndex === index && livenessStatus === "running";
              const label = step === "center" ? "Straight" : step === "left" ? "Left" : "Right";

              return (
                <div key={step} className="flex items-center gap-1.5">
                  {index > 0 && (
                    <div className={`h-px w-4 transition-colors duration-300 ${isComplete ? "bg-emerald-400/60" : "bg-gray-700"}`} />
                  )}
                  <div
                    className={`relative flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all duration-300 backdrop-blur-md ${
                      isComplete
                        ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-200"
                        : isCurrent
                        ? "border-emerald-400/40 bg-emerald-500/10 text-white"
                        : "border-gray-700 bg-gray-800/40 text-white/40"
                    }`}
                  >
                    {isComplete ? (
                      <svg className="h-3 w-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : isCurrent ? (
                      /* Mini progress dots for current step */
                      <span className="flex gap-0.5">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className={`h-1.5 w-1.5 rounded-full transition-all duration-150 ${
                              i < livenessProgress ? "bg-emerald-400" : "bg-white/20"
                            }`}
                          />
                        ))}
                      </span>
                    ) : null}
                    {label}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Status indicator - compact */}
        {livenessStatus === "passed" && (
          <div className="flex justify-center mb-3">
            <div className="flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 backdrop-blur-md px-3 py-1.5 text-[11px]">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-200">Scan complete</span>
            </div>
          </div>
        )}
      </div>

      {/* Desktop: Full card layout */}
      <Card className="hidden lg:block bg-gray-900/40 border-gray-800">
        <CardHeader>
          <CardTitle className="text-base">Face Scan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current instruction */}
          {livenessStatus === "running" && currentStep && (
            <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/5 px-4 py-3 text-center">
              <p className="text-sm text-white/60 mb-1">Follow the instruction:</p>
              <p className="text-2xl font-semibold text-emerald-200">
                {currentStep === "center" && "Look Straight Ahead"}
                {currentStep === "left" && "Slowly Turn Left"}
                {currentStep === "right" && "Slowly Turn Right"}
              </p>
            </div>
          )}

          {/* Step pills */}
          <div className="grid grid-cols-3 gap-2">
            {LIVENESS_STEPS.map((step, index) => {
              const isComplete = livenessStepIndex > index;
              const isCurrent = livenessStepIndex === index && livenessStatus === "running";
              const isPending = livenessStepIndex < index;

              return (
                <div
                  key={step}
                  className={`relative rounded-lg border px-3 py-2.5 text-center text-xs font-medium transition-all duration-300 ${
                    isComplete
                      ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-200 scale-[1.02]"
                      : isCurrent
                      ? "border-emerald-400/30 bg-emerald-500/5 text-white animate-pulse"
                      : "border-gray-800 bg-black/30 text-white/40"
                  }`}
                >
                  {isComplete && (
                    <div className="absolute -right-1 -top-1 rounded-full bg-emerald-500 p-0.5 animate-in zoom-in duration-300">
                      <svg
                        className="h-3 w-3 text-white"
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
                  )}
                  <div className="uppercase tracking-wider text-[10px]">
                    {step === "center" ? "Straight" : step === "left" ? "Left" : "Right"}
                  </div>
                  {/* Progress bar for current step */}
                  {isCurrent && (
                    <div className="mt-1.5 h-1 w-full rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-400 transition-all duration-200"
                        style={{ width: `${(livenessProgress / 3) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Status info */}
          <div className="flex items-center justify-between rounded-lg bg-black/40 px-3 py-2 text-xs">
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  livenessStatus === "passed"
                    ? "bg-emerald-400 animate-pulse"
                    : livenessStatus === "running"
                    ? "bg-amber-400 animate-pulse"
                    : "bg-gray-600"
                }`}
              />
              <span className="text-white/50">
                {livenessStatus === "passed" && "Passed"}
                {livenessStatus === "running" && "Checking..."}
                {livenessStatus === "idle" && "Not started"}
              </span>
            </div>
            <span className="text-white/30 text-[10px]">
              {yawDeg !== null ? `${yawDeg}°` : ""}
            </span>
          </div>

          {/* Start button */}
          {livenessStatus !== "passed" && (
            <Button
              className="w-full"
              onClick={() => {
                onStartLiveness();
              }}
              disabled={!canStart}
            >
              {livenessStatus === "running"
                ? "Scanning..."
                : "Start Face Scan"}
            </Button>
          )}
          {!cameraReady && livenessStatus === "idle" && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                const event = new CustomEvent("enableCamera");
                window.dispatchEvent(event);
              }}
            >
              Enable Camera
            </Button>
          )}

          {/* Success message */}
          {livenessStatus === "passed" && (
            <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-center">
              <p className="text-sm font-medium text-emerald-200">
                ✓ Liveness verified! You can now capture your face.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
