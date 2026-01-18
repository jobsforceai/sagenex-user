"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import { useAuth } from "@/app/context/AuthContext";
import { enrollFaceEmbedding, verifyFaceEmbedding, getBiometricsStatus } from "@/actions/user";
import { FaceScanHero } from "@/app/components/biometrics/FaceScanHero";
import { LivenessPanel } from "@/app/components/biometrics/LivenessPanel";
import { ActionsPanel } from "@/app/components/biometrics/ActionsPanel";
import { DeviceSheet } from "@/app/components/biometrics/DeviceSheet";
import { DebugDrawer } from "@/app/components/biometrics/DebugDrawer";

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
  const [biometricsApproved, setBiometricsApproved] = useState(true);
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

  const refreshBiometricsStatus = async () => {
    try {
      const res = await getBiometricsStatus();
      if (!res?.error) {
        const approved = res.approved === undefined ? true : Boolean(res.approved);
        setBiometricsApproved(approved);
      }
    } catch {
      // Ignore status refresh errors.
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshBiometricsStatus();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Listen for enable camera event from mobile button
    const handleEnableCamera = () => {
      setError(null);
      loadModels();
      ensureCamera()
        .then(() => refreshDevices())
        .catch(() => null);
    };
    
    window.addEventListener('enableCamera', handleEnableCamera);
    
    return () => {
      window.removeEventListener('enableCamera', handleEnableCamera);
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

  const captureFaceSnapshot = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return null;
    const targetWidth = 360;
    const scale = targetWidth / video.videoWidth;
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.7);
  };

  const handleEnroll = async () => {
    setLoadingAction("enroll");
    setError(null);
    try {
      const embedding = await getEmbeddingFromVideo();
      const faceImageUrl = captureFaceSnapshot();
      console.log("Enroll payload snapshot:", {
        hasFaceImageUrl: Boolean(faceImageUrl),
        urlcheck:faceImageUrl,
        faceImageLength: faceImageUrl?.length ?? 0,
      });
      setLastEmbedding(embedding);
      const res = await enrollFaceEmbedding({
        embedding,
        source: "SELFIE",
        faceImageUrl: faceImageUrl ?? undefined,
        meta: { note: "test enroll", capture: "webcam" },
      });
      setEnrollResponse(res);
      setEnrollSuccess(Boolean(res?.embeddingId));
      await refreshBiometricsStatus();
      if (isEnrollOnly && res?.embeddingId) {
        router.push(nextUrl || "/profile");
      }
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

  const getMainInstruction = () => {
    if (livenessStatus === "idle") return null;
    if (livenessStatus === "passed") return null;
    const step = LIVENESS_STEPS[livenessStepIndex];
    if (step === "center") return "Look Straight";
    // Camera is mirrored, so swap left/right
    if (step === "left") return "Turn Your Head Right";
    return "Turn Your Head Left";
  };

  const handleStartLiveness = () => {
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
  };

  const handleCameraRetry = () => {
    setError(null);
    loadModels();
    ensureCamera()
      .then(() => refreshDevices())
      .catch(() => null);
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

      {/* Mobile: Back button (top-left) */}
      <button
        onClick={() => window.history.back()}
        className="fixed top-4 left-4 z-50 lg:hidden rounded-full border border-gray-700 bg-gray-800/60 backdrop-blur-md p-2.5 hover:bg-gray-700/60 transition-colors"
      >
        <svg
          className="h-5 w-5 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      {/* Mobile: Full-screen camera with floating controls */}
      {/* Desktop: Two-column layout */}
      <main className="lg:container lg:mx-auto lg:px-4 lg:pt-24 lg:pb-12 xl:px-6 xl:pt-28">
        {/* Desktop Header (hidden on mobile) */}
        <header className="mb-6 space-y-2 hidden lg:block max-w-7xl mx-auto">
          <h1 className="text-2xl font-semibold lg:text-3xl">
            {isEnrollOnly ? "Face Enrollment" : "Face Verification"}
          </h1>
          <p className="text-sm text-white/60">
            {isEnrollOnly
              ? "Complete the liveness check and capture your face to enable biometric security."
              : "Test face verification with liveness detection and biometric capture."}
          </p>
        </header>

        {/* Error banner */}
        {error && (
          <div className="absolute top-20 left-4 right-4 z-50 lg:relative lg:top-0 lg:left-0 lg:right-0 lg:mb-6 lg:max-w-7xl lg:mx-auto rounded-xl border border-red-500/30 bg-red-500/10 backdrop-blur-md px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="lg:max-w-7xl lg:mx-auto lg:grid lg:gap-6 lg:grid-cols-[60%_1fr]">
          {/* Mobile: Full-screen camera | Desktop: Left column */}
          <div className="relative lg:sticky lg:top-28 lg:self-start">
            <FaceScanHero
              videoRef={videoRef}
              faceAligned={faceAligned}
              faceHint={faceHint}
              mainInstruction={getMainInstruction()}
              livenessStatus={livenessStatus}
          />

            {/* Mobile: Floating status chips (top-right) */}
            {/* Desktop: Normal DeviceSheet */}
            <div className="lg:mt-4">
              <DeviceSheet
                videoDevices={videoDevices}
                selectedDeviceId={selectedDeviceId}
                modelsReady={modelsReady}
                cameraReady={cameraReady}
                onDeviceChange={setSelectedDeviceId}
                onRetry={handleCameraRetry}
              />
            </div>
          </div>

          {/* Mobile: Floating controls | Desktop: Right column */}
          <div className="fixed bottom-0 left-0 right-0 z-40 lg:relative lg:space-y-4">
            <LivenessPanel
              livenessStatus={livenessStatus}
              livenessStepIndex={livenessStepIndex}
              yawDeg={yawDeg}
              modelsReady={modelsReady}
              cameraReady={cameraReady}
              onStartLiveness={handleStartLiveness}
            />

            <ActionsPanel
              isEnrollOnly={isEnrollOnly}
              livenessStatus={livenessStatus}
              loadingAction={loadingAction}
              enrollSuccess={enrollSuccess}
              biometricsApproved={biometricsApproved}
              nextUrl={nextUrl}
              modelsReady={modelsReady}
              cameraReady={cameraReady}
              onEnroll={handleEnroll}
              onVerify={handleVerify}
              onStartLiveness={handleStartLiveness}
            />

            <DebugDrawer
              enrollResponse={enrollResponse}
              verifyResponse={verifyResponse}
            />
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
