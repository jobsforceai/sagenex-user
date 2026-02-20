"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ActionsPanelProps {
  isEnrollOnly: boolean;
  livenessStatus: "idle" | "running" | "passed";
  loadingAction: "enroll" | "verify" | null;
  enrollSuccess: boolean;
  isEnrolled: boolean;
  biometricsApproved: boolean;
  nextUrl: string | null;
  modelsReady: boolean;
  cameraReady: boolean;
  onEnroll: () => void;
  onVerify: () => void;
  onStartLiveness: () => void;
}

export function ActionsPanel({
  isEnrollOnly,
  livenessStatus,
  loadingAction,
  enrollSuccess,
  isEnrolled,
  biometricsApproved,
  nextUrl,
  modelsReady,
  cameraReady,
  onEnroll,
  onVerify,
  onStartLiveness,
}: ActionsPanelProps) {
  const canCapture = livenessStatus === "passed" && loadingAction === null;
  const canStart = modelsReady && cameraReady && livenessStatus === "idle";
  const returnUrl = nextUrl || "/profile";

  return (
    <>
      {/* Mobile: Floating button(s) at bottom */}
      <div className="lg:hidden px-4 pb-4">
        {/* Status message */}
        {enrollSuccess && !biometricsApproved && (
          <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 backdrop-blur-md px-3 py-2 text-xs text-amber-100">
            <p className="font-medium">Enrollment Submitted</p>
            <p className="text-[10px] text-amber-200/80 mt-0.5">
              Awaiting admin approval
            </p>
          </div>
        )}

        {enrollSuccess && biometricsApproved && (
          <div className="mb-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-md px-3 py-2 text-xs text-emerald-100">
            <p className="font-medium">✓ Face Enrolled Successfully</p>
          </div>
        )}
        {isEnrolled && (
          <div className="mb-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-md px-3 py-2 text-xs text-emerald-100">
            <p className="font-medium">✓ Face already enrolled</p>
          </div>
        )}

        {/* Action button(s) - only show when liveness is idle or passed */}
        {livenessStatus !== "running" && (
          <div className={`grid gap-2 ${isEnrollOnly ? "" : "grid-cols-2"}`}>
            {livenessStatus === "passed" && (
              <>
                <Button
                  className="w-full shadow-lg"
                  size="lg"
                  onClick={onEnroll}
                  disabled={!canCapture || isEnrolled}
                >
                  {loadingAction === "enroll" ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="h-4 w-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Enrolling...
                    </span>
                  ) : (
                    "Enroll Face"
                  )}
                </Button>
                {isEnrollOnly && isEnrolled && (
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="w-full shadow-lg"
                  >
                    <a href={returnUrl}>Return to Profile</a>
                  </Button>
                )}

                {!isEnrollOnly && (
                  <Button
                    className="w-full shadow-lg"
                    size="lg"
                    variant="outline"
                    onClick={onVerify}
                    disabled={!canCapture}
                  >
                    {loadingAction === "verify" ? (
                      <span className="flex items-center gap-2">
                        <svg
                          className="h-4 w-4 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Verifying...
                      </span>
                    ) : (
                      "Verify Face"
                    )}
                  </Button>
                )}
              </>
            )}

            {/* Return to wallet button */}
            {isEnrollOnly && enrollSuccess && nextUrl && (
              <Button
                asChild
                variant="outline"
                className="w-full shadow-lg"
                size="lg"
              >
                <a href={nextUrl}>Return to Wallet</a>
              </Button>
            )}

            {/* Start liveness button - show when idle */}
            {livenessStatus === "idle" && (
              <Button
                className={`w-full shadow-lg ${isEnrollOnly ? "" : "col-span-2"}`}
                size="lg"
                onClick={onStartLiveness}
                disabled={!canStart}
              >
                Start Face Scan
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Desktop: Full card layout */}
      <Card className="hidden lg:block bg-gray-900/40 border-gray-800">
        <CardHeader>
          <CardTitle className="text-base">
            {isEnrollOnly ? "Complete Enrollment" : "Capture Face"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status message */}
          {enrollSuccess && !biometricsApproved && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              <p className="font-medium mb-1">Enrollment Submitted</p>
              <p className="text-xs text-amber-200/80">
                Awaiting admin approval before you can use face verification.
              </p>
            </div>
          )}

          {enrollSuccess && biometricsApproved && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              <p className="font-medium">✓ Face Enrolled Successfully</p>
            </div>
          )}

          {/* Action buttons */}
          <div className={`grid gap-3 ${isEnrollOnly ? "" : "sm:grid-cols-2"}`}>
            <Button
              className="w-full"
              size="lg"
              onClick={onEnroll}
              disabled={!canCapture || isEnrolled}
            >
              {loadingAction === "enroll" ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Enrolling...
                </span>
              ) : (
                "Enroll Face"
              )}
            </Button>
            {isEnrollOnly && isEnrolled && (
              <Button asChild variant="outline" className="w-full" size="lg">
                <a href={returnUrl}>Return to Profile</a>
              </Button>
            )}

            {!isEnrollOnly && (
              <Button
                className="w-full"
                size="lg"
                variant="outline"
                onClick={onVerify}
                disabled={!canCapture}
              >
                {loadingAction === "verify" ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="h-4 w-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Verifying...
                  </span>
                ) : (
                  "Verify Face"
                )}
              </Button>
            )}
          </div>

          {/* Helper text */}
          {!canCapture && (
            <p className="text-xs text-center text-white/40">
              Complete the liveness check to unlock capture
            </p>
          )}

          {/* Return to wallet button */}
          {isEnrollOnly && enrollSuccess && nextUrl && (
            <Button
              asChild
              variant="outline"
              className="w-full"
              size="lg"
            >
              <a href={nextUrl}>Return to Wallet</a>
            </Button>
          )}
        </CardContent>
      </Card>
    </>
  );
}
