"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShieldCheck, X } from "lucide-react";
import { getBiometricsStatus, verifyFaceEmbedding } from "@/actions/user";
import { FaceScanHero } from "./FaceScanHero";
import { DeviceSheet } from "./DeviceSheet";

const MODEL_PATH = "/models/face-api";

type FaceVerificationPanelProps = {
  purpose: "WITHDRAWAL" | "TRANSFER" | "KYC";
  enrollHref: string;
  onVerified?: (passed: boolean) => void;
  onEnrollmentChange?: (enrolled: boolean) => void;
  onVerificationToken?: (token: { verificationId: string; expiresAt?: string | null } | null) => void;
  onApprovalChange?: (approved: boolean) => void;
  variant?: "inline" | "modal";
  onClose?: () => void;
};

export default function FaceVerificationPanel({
  purpose,
  enrollHref,
  onVerified,
  onEnrollmentChange,
  onVerificationToken,
  onApprovalChange,
  variant = "inline",
  onClose,
}: FaceVerificationPanelProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceApiRef = useRef<typeof import("face-api.js") | null>(null);

  const [statusLoading, setStatusLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const [lastEnrolledAt, setLastEnrolledAt] = useState<string | null>(null);
  const [approved, setApproved] = useState(true);
  const [pending, setPending] = useState(false);
  const [modelsReady, setModelsReady] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [mainInstruction, setMainInstruction] = useState("Position your face in the oval");

  const modalVariant = variant === "modal";

  useEffect(() => {
    const fetchStatus = async () => {
      setStatusLoading(true);
      try {
        const res = await getBiometricsStatus();
        if (!res?.error) {
          const isEnrolled = Boolean(res.enrolled);
          const isApproved = res.approved === undefined ? true : Boolean(res.approved);
          const isPending = Boolean(res.pending);
          setEnrolled(isEnrolled);
          setApproved(isApproved);
          setPending(isPending);
          setLastEnrolledAt(res.lastEnrolledAt || null);
          onEnrollmentChange?.(isEnrolled);
          onApprovalChange?.(isApproved);
        }
      } finally {
        setStatusLoading(false);
      }
    };
    void fetchStatus();
  }, []);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const refreshDevices = async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoInputs = devices.filter((device) => device.kind === "videoinput");
    setVideoDevices(videoInputs);
    if (!selectedDeviceId && videoInputs.length > 0) {
      setSelectedDeviceId(videoInputs[0].deviceId);
    }
  };

  const loadModels = async () => {
    if (modelsReady) return;
    const faceapi = await import("face-api.js");
    faceApiRef.current = faceapi;
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_PATH),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_PATH),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_PATH),
    ]);
    setModelsReady(true);
  };

  const startCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Camera access is not supported in this browser.");
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    try {
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
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise<void>((resolve) => {
          if (!videoRef.current) return resolve();
          videoRef.current.onloadedmetadata = () => resolve();
        });
        await videoRef.current.play();
        setCameraReady(true);
      }
    } catch (err: any) {
      setCameraError(err?.message || "Failed to start camera");
      throw err;
    }
  };

  const ensureCamera = async () => {
    if (cameraReady) return;
    await startCamera();
  };

  const getEmbeddingFromVideo = async () => {
    await loadModels();
    await ensureCamera();
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
      throw new Error("No face detected. Look at the camera and try again.");
    }
    if (detections.length > 1) {
      throw new Error("Multiple faces detected. Keep only one face in frame.");
    }
    return Array.from(detections[0].descriptor).map((value) =>
      Number(value.toFixed(6))
    );
  };

  const handleVerify = async () => {
    setError(null);
    setVerifying(true);
    setMainInstruction("Hold still, verifying...");
    try {
      const embedding = await getEmbeddingFromVideo();
      const res = await verifyFaceEmbedding({
        embedding,
        purpose,
        livenessScore: 0.8,
        meta: { note: "verify" },
      });
      if (res?.passed) {
        setVerified(true);
        setVerificationId(res.verificationId || null);
        setMainInstruction("Verification successful!");
        onVerificationToken?.(
          res.verificationId
            ? { verificationId: res.verificationId, expiresAt: res.expiresAt || null }
            : null
        );
        onVerified?.(true);
      } else {
        setVerified(false);
        setVerificationId(null);
        onVerificationToken?.(null);
        onVerified?.(false);
        setMainInstruction("Position your face in the oval");
        setError("Face verification failed. Please try again.");
      }
    } catch (err: any) {
      setMainInstruction("Position your face in the oval");
      setError(err?.message || "Face verification failed.");
      setVerificationId(null);
      onVerificationToken?.(null);
    } finally {
      setVerifying(false);
    }
  };

  if (statusLoading) {
    return (
      <Card className="bg-gray-900/40 border-gray-800 p-4 text-sm text-gray-400">
        Checking face verification status...
      </Card>
    );
  }

  if (!enrolled) {
    return (
      <Card className="bg-gray-900/40 border border-amber-500/30 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">Enable Face Verification</p>
            <p className="text-xs text-gray-400">
              Add face verification for extra security during {purpose.toLowerCase()}.
            </p>
          </div>
          <Button asChild variant="outline" className="border-amber-400/40 text-amber-200">
            <Link href={enrollHref}>Set up face</Link>
          </Button>
        </div>
      </Card>
    );
  }

  if (pending) {
    return (
      <Card className="bg-gray-900/40 border border-amber-500/30 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">Awaiting admin approval</p>
            <p className="text-xs text-gray-400">
              Your face enrollment is pending review. You can continue with OTP or password.
            </p>
          </div>
          {lastEnrolledAt && (
            <span className="text-xs text-gray-500">
              Enrolled {new Date(lastEnrolledAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className={modalVariant ? "space-y-3" : "space-y-4"}>
      {/* Header / Status */}
      {modalVariant ? (
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              Face Verification
            </p>
            <p className="text-xs text-gray-400">
              {purpose === "TRANSFER" ? "Verify to continue transfer" : "Verify to continue"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {verified && (
              <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
                Verified ✓
              </span>
            )}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-800 bg-black/40 text-gray-200 hover:bg-white/5"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <Card className="bg-gray-900/40 border border-emerald-500/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                Verify with Face
              </p>
              <p className="text-xs text-gray-400">
                {lastEnrolledAt
                  ? `Enrolled on ${new Date(lastEnrolledAt).toLocaleDateString()}`
                  : "Face is enrolled."}
              </p>
            </div>
            {verified && (
              <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
                Face verified ✓
              </span>
            )}
          </div>
        </Card>
      )}

      {/* Camera Preview */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-800 bg-black">
        <FaceScanHero
          videoRef={videoRef}
          faceAligned={cameraReady && !verifying}
          faceHint={cameraReady ? (verified ? "Verified ✓" : "Ready") : null}
          mainInstruction={mainInstruction}
          livenessStatus={verified ? "passed" : verifying ? "running" : "idle"}
          layout={modalVariant ? "contained" : "full"}
        />

        {/* Overlay: camera settings/status */}
        <DeviceSheet
          videoDevices={videoDevices}
          selectedDeviceId={selectedDeviceId}
          modelsReady={modelsReady}
          cameraReady={cameraReady}
          onDeviceChange={setSelectedDeviceId}
          onRetry={() => {
            setCameraError(null);
            loadModels()
              .then(refreshDevices)
              .then(startCamera)
              .catch((err: any) => setCameraError(err?.message || "Camera failed"));
          }}
          mode={modalVariant ? "overlay" : "inline"}
        />

        {/* Overlay: errors */}
        {(error || cameraError) && modalVariant && (
          <div className="absolute left-3 bottom-20 right-3 z-20 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200 backdrop-blur">
            {error || cameraError}
          </div>
        )}

        {/* Overlay: actions */}
        {modalVariant && (
          <div className="absolute bottom-4 left-1/2 z-20 flex w-[min(520px,calc(100%-24px))] -translate-x-1/2 items-center gap-2 rounded-2xl border border-gray-800 bg-black/60 p-2 backdrop-blur">
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-gray-700 text-gray-100 hover:bg-white/5"
              onClick={() => {
                setError(null);
                setCameraError(null);
                loadModels()
                  .then(refreshDevices)
                  .then(startCamera)
                  .catch((err: any) => {
                    const errorMsg = err?.message || "Camera failed to start.";
                    setError(errorMsg);
                    setCameraError(errorMsg);
                  });
              }}
              disabled={cameraReady}
            >
              {cameraReady ? "Camera Ready" : "Enable Camera"}
            </Button>
            <Button
              type="button"
              className="flex-1 bg-emerald-600 text-white hover:bg-emerald-500"
              onClick={handleVerify}
              disabled={verifying || !cameraReady}
            >
              {verifying ? "Verifying..." : "Verify"}
            </Button>
          </div>
        )}
      </div>

      {/* Inline-only helpers */}
      {!modalVariant && (
        <>
          {/* Error Messages */}
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {error}
            </div>
          )}

          {/* Success Message */}
          {verificationId && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
              ✓ Verification valid for 5 minutes.
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setError(null);
                setCameraError(null);
                loadModels()
                  .then(refreshDevices)
                  .then(startCamera)
                  .catch((err: any) => {
                    const errorMsg = err?.message || "Camera failed to start.";
                    setError(errorMsg);
                    setCameraError(errorMsg);
                  });
              }}
              disabled={cameraReady}
            >
              {cameraReady ? "Camera Ready" : "Enable Camera"}
            </Button>
            <Button onClick={handleVerify} disabled={verifying || !cameraReady}>
              {verifying ? "Verifying..." : "Verify with Face"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
