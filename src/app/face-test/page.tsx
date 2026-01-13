"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import { useAuth } from "@/app/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { enrollFaceEmbedding, verifyFaceEmbedding } from "@/actions/user";
import { ChevronDown } from "lucide-react";

const MODEL_PATH = "/models/face-api";
const LIVENESS_STEPS = ["center", "left", "right"] as const;
type LivenessStep = (typeof LIVENESS_STEPS)[number];

function FaceTestContent() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const nextUrl = searchParams.get("next");
  const isEnrollOnly = mode === "enroll";
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceApiRef = useRef<typeof import("face-api.js") | null>(null);
  const [lastEmbedding, setLastEmbedding] = useState<number[] | null>(null);
  const [enrollResponse, setEnrollResponse] = useState<unknown>(null);
  const [enrollSuccess, setEnrollSuccess] = useState(false);
  const [verifyResponse, setVerifyResponse] = useState<unknown>(null);
  const [loadingAction, setLoadingAction] = useState<"enroll" | "verify" | null>(
    null
  );
  const [modelsReady, setModelsReady] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [livenessStatus, setLivenessStatus] = useState<
    "idle" | "running" | "passed"
  >("idle");
  const [livenessStepIndex, setLivenessStepIndex] = useState(0);
  const [yawDeg, setYawDeg] = useState<number | null>(null);
  const [faceAligned, setFaceAligned] = useState(false);
  const [faceHint, setFaceHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const livenessRef = useRef({ stepIndex: 0, stableCount: 0, missCount: 0, logCount: 0 });
  const livenessActiveRef = useRef(false);
  const livenessTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login?next=/face-test");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    return () => {
      if (livenessTimerRef.current) {
        window.clearTimeout(livenessTimerRef.current);
        livenessTimerRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const loadModels = async () => {
    if (modelsReady || modelsLoading) return;
    setModelsLoading(true);
    setError(null);
    try {
      const faceapi = await import("face-api.js");
      faceApiRef.current = faceapi;
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_PATH),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_PATH),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_PATH),
      ]);
      setModelsReady(true);
    } catch (err: any) {
      setError(err?.message || "Failed to load face models.");
    } finally {
      setModelsLoading(false);
    }
  };

  const mapCameraError = (err: any) => {
    const name = err?.name;
    if (name === "NotAllowedError") {
      return "Camera permission blocked. Allow camera access in browser settings and reload.";
    }
    if (name === "NotFoundError") {
      return "No camera detected. Check OS camera permissions and try again.";
    }
    if (name === "NotReadableError") {
      return "Camera is already in use. Close other apps (Zoom/Meet/FaceTime) and retry.";
    }
    if (name === "OverconstrainedError") {
      return "Requested camera settings are not supported. Try a different camera.";
    }
    if (name === "SecurityError") {
      return "Camera requires HTTPS or localhost. Use a secure URL.";
    }
    return err?.message || "Failed to start camera.";
  };

  const refreshDevices = async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoInputs = devices.filter((device) => device.kind === "videoinput");
    setVideoDevices(videoInputs);
    if (!selectedDeviceId && videoInputs.length > 0) {
      setSelectedDeviceId(videoInputs[0].deviceId);
    }
  };

  const getPointCenter = (points: Array<{ x: number; y: number }>) => {
    const total = points.reduce(
      (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
      { x: 0, y: 0 }
    );
    return { x: total.x / points.length, y: total.y / points.length };
  };

  const estimateYawDeg = (landmarks: any) => {
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    const nose = landmarks.getNose();
    const leftCenter = getPointCenter(leftEye);
    const rightCenter = getPointCenter(rightEye);
    const noseTip = nose[3] || nose[nose.length - 1];
    const eyeCenterX = (leftCenter.x + rightCenter.x) / 2;
    const eyeDistance = Math.max(1, Math.abs(rightCenter.x - leftCenter.x));
    const offset = noseTip.x - eyeCenterX;
    const yawRatio = offset / eyeDistance;
    return yawRatio * 60;
  };

  const matchesStep = (yaw: number, step: LivenessStep) => {
    if (step === "center") return yaw >= -5 && yaw <= 5;
    if (step === "left") return yaw < -15;
    return yaw > 15;
  };

  const stopLivenessLoop = () => {
    livenessActiveRef.current = false;
    if (livenessTimerRef.current) {
      window.clearTimeout(livenessTimerRef.current);
      livenessTimerRef.current = null;
    }
  };

  const runLivenessLoop = async () => {
    if (!livenessActiveRef.current || !modelsReady || !cameraReady) return;
    const faceapi = faceApiRef.current;
    const video = videoRef.current;
    if (!faceapi || !video) return;
    if (video.readyState < 2) {
      livenessTimerRef.current = window.setTimeout(runLivenessLoop, 350);
      return;
    }
    try {
      const detection = await faceapi
        .detectSingleFace(
          video,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.4 })
        )
        .withFaceLandmarks();
      if (detection?.landmarks) {
        livenessRef.current.missCount = 0;
        const yaw = estimateYawDeg(detection.landmarks);
        setYawDeg(Number(yaw.toFixed(2)));
        const box = detection.detection.box;
        const minDim = Math.min(video.videoWidth || 0, video.videoHeight || 0);
        const ellipseWidth = minDim * 0.6;
        const ellipseHeight = minDim * 0.78;
        const centerX = (video.videoWidth || 0) / 2;
        const centerY = (video.videoHeight || 0) / 2;
        const faceCenterX = box.x + box.width / 2;
        const faceCenterY = box.y + box.height / 2;
        const dxNorm = (faceCenterX - centerX) / (ellipseWidth / 2);
        const dyNorm = (faceCenterY - centerY) / (ellipseHeight / 2);
        const corners = [
          { x: box.x, y: box.y },
          { x: box.x + box.width, y: box.y },
          { x: box.x, y: box.y + box.height },
          { x: box.x + box.width, y: box.y + box.height },
        ];
        const inside = corners.every((point) => {
          const dx = (point.x - centerX) / (ellipseWidth / 2);
          const dy = (point.y - centerY) / (ellipseHeight / 2);
          return dx * dx + dy * dy <= 1;
        });
        setFaceAligned(inside);
        if (inside) {
          setFaceHint("Face aligned ✅");
        } else if (Math.abs(dxNorm) > Math.abs(dyNorm)) {
          setFaceHint(dxNorm > 0 ? "Move slightly left" : "Move slightly right");
        } else {
          setFaceHint(dyNorm > 0 ? "Move slightly up" : "Move slightly down");
        }
        if (livenessRef.current.logCount % 5 === 0) {
          console.log("Face alignment:", {
            inside,
            box: {
              x: Number(box.x.toFixed(2)),
              y: Number(box.y.toFixed(2)),
              width: Number(box.width.toFixed(2)),
              height: Number(box.height.toFixed(2)),
            },
            video: { width: video.videoWidth, height: video.videoHeight },
          });
        }
        const expectedStep = LIVENESS_STEPS[livenessRef.current.stepIndex];
        livenessRef.current.logCount += 1;
        if (livenessRef.current.logCount % 5 === 0) {
          console.log("Liveness check:", {
            yaw: Number(yaw.toFixed(2)),
            expectedStep,
            stepIndex: livenessRef.current.stepIndex,
            stableCount: livenessRef.current.stableCount,
          });
        }
        if (matchesStep(yaw, expectedStep)) {
          livenessRef.current.stableCount += 1;
          if (livenessRef.current.stableCount >= 3) {
            livenessRef.current.stepIndex += 1;
            livenessRef.current.stableCount = 0;
            setLivenessStepIndex(livenessRef.current.stepIndex);
            if (livenessRef.current.stepIndex >= LIVENESS_STEPS.length) {
              setLivenessStatus("passed");
              stopLivenessLoop();
              return;
            }
          }
        } else {
          livenessRef.current.stableCount = 0;
        }
      } else {
        setYawDeg(null);
        setFaceAligned(false);
        setFaceHint("Face not detected. Move closer and center your face.");
        livenessRef.current.missCount += 1;
        livenessRef.current.logCount += 1;
        if (livenessRef.current.logCount % 5 === 0) {
          console.log("Liveness check: no face detected", {
            missCount: livenessRef.current.missCount,
            stepIndex: livenessRef.current.stepIndex,
          });
        }
        if (livenessRef.current.missCount >= 6) {
          setError("No face detected. Move closer to the camera and keep your face centered.");
          livenessRef.current.missCount = 0;
        }
      }
    } catch {
      // Ignore detection errors during the loop.
    }
    livenessTimerRef.current = window.setTimeout(runLivenessLoop, 350);
  };

  const startCamera = async (videoEl: HTMLVideoElement) => {
    try {
      console.log("Secure context?", window.isSecureContext);
      if (navigator.mediaDevices?.enumerateDevices) {
        console.log("Devices:", await navigator.mediaDevices.enumerateDevices());
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.() as MediaTrackCapabilities | undefined;
      const zoom = (capabilities as MediaTrackCapabilities & { zoom?: { min?: number } })?.zoom;
      if (zoom?.min !== undefined) {
        const zoomConstraints = {
          advanced: [{ zoom: zoom.min } as any],
        };
        await track.applyConstraints(zoomConstraints as any);
      }
      videoEl.srcObject = stream;
      await new Promise<void>((resolve) => {
        videoEl.onloadedmetadata = () => resolve();
      });
      await videoEl.play();
      console.log("Camera started ✅");
      return stream;
    } catch (err: any) {
      console.error(
        "Camera start failed ❌",
        err?.name,
        err?.message,
        err
      );
      setError(mapCameraError(err));
      throw err;
    }
  };

  const ensureCamera = async () => {
    if (cameraReady) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Camera access is not supported in this browser.");
    }
    if (videoRef.current) {
      const stream = await startCamera(videoRef.current);
      streamRef.current = stream;
      setCameraReady(true);
    }
  };

  const getEmbeddingFromVideo = async () => {
    await loadModels();
    await ensureCamera();
    if (livenessStatus !== "passed") {
      throw new Error("Complete the liveness check before capturing.");
    }
    const faceapi = faceApiRef.current;
    const video = videoRef.current;
    if (!faceapi || !video) {
      throw new Error("Face detection is not ready.");
    }
    const detections = await faceapi
      .detectAllFaces(
        video,
        new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 })
      )
      .withFaceLandmarks()
      .withFaceDescriptors();
    if (!detections || detections.length === 0) {
      throw new Error("No face detected. Please look at the camera and try again.");
    }
    if (detections.length > 1) {
      throw new Error("Multiple faces detected. Please keep only one face in frame.");
    }
    return Array.from(detections[0].descriptor).map((value) =>
      Number(value.toFixed(6))
    );
  };

  const handleEnroll = async () => {
    setLoadingAction("enroll");
    setError(null);
    try {
      const embedding = await getEmbeddingFromVideo();
      setLastEmbedding(embedding);
      const res = await enrollFaceEmbedding({
        embedding,
        source: "SELFIE",
        meta: { note: "test enroll" },
      });
      setEnrollResponse(res);
      setEnrollSuccess(Boolean(res?.embeddingId));
    } catch (err: any) {
      setError(err?.message || "Failed to enroll face embedding.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleVerify = async () => {
    setLoadingAction("verify");
    setError(null);
    try {
      const embedding = await getEmbeddingFromVideo();
      setLastEmbedding(embedding);
      const res = await verifyFaceEmbedding({
        embedding,
        purpose: "LOGIN",
        livenessScore: 0.8,
        meta: { note: "test verify" },
      });
      setVerifyResponse(res);
    } catch (err: any) {
      setError(err?.message || "Failed to verify face embedding.");
    } finally {
      setLoadingAction(null);
    }
  };

  if (loading || !isAuthenticated) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading...
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <main className="container mx-auto px-6 pt-28 pb-12">
        <div className="max-w-4xl mx-auto space-y-6">
          <header className="space-y-2">
            <h1 className="text-3xl font-semibold">
              {isEnrollOnly ? "Face Enrollment" : "Face Test"}
            </h1>
            <p className="text-sm text-white/70">
              {isEnrollOnly
                ? "Set up face verification by capturing a live frame and enrolling your embedding."
                : "This test captures a live camera frame, generates a 128-d embedding, and sends it to the enroll/verify endpoints."}
            </p>
          </header>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <Card className="bg-gray-900/40 border-gray-800">
            <CardHeader>
              <CardTitle className="text-base">Camera Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative w-full overflow-hidden rounded-2xl border border-gray-800 bg-black/80">
                <div className="relative aspect-square w-full">
                  {faceHint && (
                    <div className={`absolute right-3 top-3 z-10 rounded-full border px-3 py-1 text-[11px] font-semibold ${
                      faceAligned
                        ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-100"
                        : "border-amber-400/40 bg-amber-500/15 text-amber-100"
                    }`}>
                      {faceHint}
                    </div>
                  )}
                  <video
                    ref={videoRef}
                    className="absolute inset-0 h-full w-full object-cover"
                    autoPlay
                    muted
                    playsInline
                  />
                  <div className="pointer-events-none absolute inset-0 face-scan-mask" />
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className={`h-[78%] w-[60%] rounded-[45%] border ${
                      faceAligned ? "border-emerald-200 shadow-[0_0_30px_rgba(16,185,129,0.8)]" : "border-emerald-400/40"
                    }`} />
                  </div>
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div
                      className={`h-[90%] w-[70%] rounded-[45%] face-scan-ticks ${
                        faceAligned ? "face-scan-aligned opacity-100" : "opacity-80"
                      }`}
                    />
                  </div>
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="relative h-[78%] w-[60%] rounded-[45%] face-scan-crosshair">
                      <div className={`absolute left-1/2 top-[6%] h-[88%] w-px -translate-x-1/2 ${
                        faceAligned ? "bg-emerald-200 shadow-[0_0_16px_rgba(16,185,129,0.9)]" : "bg-emerald-300/40"
                      }`} />
                      <div className={`absolute left-[6%] top-1/2 h-px w-[88%] -translate-y-1/2 ${
                        faceAligned ? "bg-emerald-200 shadow-[0_0_16px_rgba(16,185,129,0.9)]" : "bg-emerald-300/40"
                      }`} />
                    </div>
                  </div>
                </div>
                <div className="px-4 pb-4 pt-2 text-center text-xs text-white/70">
                  Keep your face inside the circle and move your head slowly to complete the scan.
                </div>
              </div>
              <div className="grid gap-3 text-sm text-white/70 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="flex flex-wrap items-center gap-3">
                  <span>
                    Models:{" "}
                    {modelsReady ? "Ready" : modelsLoading ? "Loading..." : "Not loaded"}
                  </span>
                  <span>Camera: {cameraReady ? "Ready" : "Not started"}</span>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setError(null);
                    loadModels();
                    ensureCamera()
                      .then(() => refreshDevices())
                      .catch(() => null);
                  }}
                >
                  Enable Camera
                </Button>
              </div>
              {videoDevices.length > 0 && (
                <div className="flex flex-col gap-2 text-sm text-white/70">
                  <label htmlFor="cameraSelect" className="text-xs uppercase tracking-[0.2em] text-white/50">
                    Camera
                  </label>
                  <div className="relative">
                    <select
                      id="cameraSelect"
                      value={selectedDeviceId}
                      onChange={(event) => setSelectedDeviceId(event.target.value)}
                      className="w-full appearance-none rounded-lg border border-gray-800 bg-black/40 px-3 py-2 text-sm text-white/80"
                    >
                      {videoDevices.map((device) => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label || "Camera"}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  </div>
                  <Button
                    variant="ghost"
                    className="w-fit px-0 text-xs text-emerald-300 hover:bg-transparent"
                    onClick={() => {
                      setError(null);
                      ensureCamera()
                        .then(() => refreshDevices())
                        .catch(() => null);
                    }}
                  >
                    Retry with selected camera
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gray-900/40 border-gray-800">
            <CardHeader>
              <CardTitle className="text-base">Liveness Check</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="text-sm text-white/70">
                  Follow the head-turn sequence to unlock submit:
                  <span className="ml-2 text-emerald-200">
                    Center → Left → Right
                  </span>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setError(null);
                    if (!modelsReady || !cameraReady) {
                      setError("Enable camera and load models before starting liveness.");
                      return;
                    }
                    livenessRef.current = { stepIndex: 0, stableCount: 0, missCount: 0, logCount: 0 };
                    setLivenessStepIndex(0);
                    setYawDeg(null);
                    setFaceAligned(false);
                    setFaceHint(null);
                    livenessActiveRef.current = true;
                    setLivenessStatus("running");
                    runLivenessLoop();
                  }}
                >
                  {livenessStatus === "running" ? "Checking..." : "Start Liveness"}
                </Button>
              </div>
              <div className="grid gap-2 sm:grid-cols-3 text-xs text-white/60">
                {LIVENESS_STEPS.map((step, index) => (
                  <div
                    key={step}
                    className={`rounded-lg border px-3 py-2 ${
                      livenessStepIndex > index
                        ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-200"
                        : livenessStepIndex === index && livenessStatus === "running"
                        ? "border-emerald-400/30 bg-emerald-500/5 text-white"
                        : "border-gray-800 bg-black/30"
                    }`}
                  >
                    {step.toUpperCase()}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-white/50">
                <span>Status: {livenessStatus}</span>
                <span>Yaw: {yawDeg !== null ? `${yawDeg}°` : "—"}</span>
              </div>
            </CardContent>
          </Card>

          <div className={`grid gap-4 ${isEnrollOnly ? "" : "sm:grid-cols-2"}`}>
            <Button
              onClick={handleEnroll}
              disabled={loadingAction !== null || livenessStatus !== "passed"}
            >
              {loadingAction === "enroll" ? "Enrolling..." : "Capture + Enroll"}
            </Button>
            {!isEnrollOnly && (
              <Button
                variant="outline"
                onClick={handleVerify}
                disabled={loadingAction !== null || livenessStatus !== "passed"}
              >
                {loadingAction === "verify" ? "Verifying..." : "Capture + Verify"}
              </Button>
            )}
          </div>

          {isEnrollOnly && enrollSuccess && nextUrl && (
            <Button asChild variant="outline">
              <a href={nextUrl}>Return to Wallet</a>
            </Button>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="bg-gray-900/40 border-gray-800">
              <CardHeader>
                <CardTitle className="text-base">Enroll Response</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs whitespace-pre-wrap break-words text-gray-300">
                  {enrollResponse ? JSON.stringify(enrollResponse, null, 2) : "—"}
                </pre>
              </CardContent>
            </Card>
            <Card className="bg-gray-900/40 border-gray-800">
              <CardHeader>
                <CardTitle className="text-base">Verify Response</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs whitespace-pre-wrap break-words text-gray-300">
                  {verifyResponse ? JSON.stringify(verifyResponse, null, 2) : "—"}
                </pre>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function FaceTestPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black text-white flex items-center justify-center">
          Loading...
        </main>
      }
    >
      <FaceTestContent />
    </Suspense>
  );
}
