"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronDown, ShieldCheck } from "lucide-react";
import { getBiometricsStatus, verifyFaceEmbedding } from "@/actions/user";

const MODEL_PATH = "/models/face-api";

type FaceVerificationPanelProps = {
  purpose: "WITHDRAWAL" | "TRANSFER";
  enrollHref: string;
  onVerified?: (passed: boolean) => void;
};

export default function FaceVerificationPanel({
  purpose,
  enrollHref,
  onVerified,
}: FaceVerificationPanelProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceApiRef = useRef<typeof import("face-api.js") | null>(null);

  const [statusLoading, setStatusLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const [lastEnrolledAt, setLastEnrolledAt] = useState<string | null>(null);
  const [modelsReady, setModelsReady] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");

  useEffect(() => {
    const fetchStatus = async () => {
      setStatusLoading(true);
      try {
        const res = await getBiometricsStatus();
        if (!res?.error) {
          setEnrolled(Boolean(res.enrolled));
          setLastEnrolledAt(res.lastEnrolledAt || null);
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
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Camera access is not supported in this browser.");
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
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
    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCameraReady(true);
    }
  };

  const getEmbeddingFromVideo = async () => {
    await loadModels();
    await startCamera();
    const faceapi = faceApiRef.current;
    const video = videoRef.current;
    if (!faceapi || !video) {
      throw new Error("Face detection is not ready.");
    }
    const detection = await faceapi
      .detectSingleFace(
        video,
        new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 })
      )
      .withFaceLandmarks()
      .withFaceDescriptor();
    if (!detection?.descriptor) {
      throw new Error("No face detected. Look at the camera and try again.");
    }
    return Array.from(detection.descriptor).map((value) =>
      Number(value.toFixed(6))
    );
  };

  const handleVerify = async () => {
    setError(null);
    setVerifying(true);
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
        onVerified?.(true);
      } else {
        setVerified(false);
        onVerified?.(false);
        setError("Face verification failed. Please try again.");
      }
    } catch (err: any) {
      setError(err?.message || "Face verification failed.");
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

  return (
    <Card className="bg-gray-900/40 border border-emerald-500/20 p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            Verify with Face
          </p>
          <p className="text-xs text-gray-400">
            {lastEnrolledAt ? `Enrolled on ${new Date(lastEnrolledAt).toLocaleDateString()}` : "Face is enrolled."}
          </p>
        </div>
        {verified && (
          <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
            Face verified
          </span>
        )}
      </div>

      <div className="relative w-full overflow-hidden rounded-2xl border border-gray-800 bg-black/80">
        <div className="relative aspect-square w-full">
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            muted
            playsInline
          />
          <div className="pointer-events-none absolute inset-0 face-scan-mask" />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[78%] w-[60%] rounded-[45%] border border-emerald-400/40" />
          </div>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[90%] w-[70%] rounded-[45%] face-scan-ticks opacity-80" />
          </div>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-[78%] w-[60%] rounded-[45%] face-scan-crosshair">
              <div className="absolute left-1/2 top-[6%] h-[88%] w-px -translate-x-1/2 bg-emerald-300/40" />
              <div className="absolute left-[6%] top-1/2 h-px w-[88%] -translate-y-1/2 bg-emerald-300/40" />
            </div>
          </div>
        </div>
        <div className="px-4 pb-4 pt-2 text-center text-xs text-white/70">
          Keep your face inside the oval before verifying.
        </div>
      </div>

      {videoDevices.length > 0 && (
        <div className="flex flex-col gap-2 text-xs text-gray-400">
          <label htmlFor="face-camera-select" className="uppercase tracking-[0.2em]">
            Camera
          </label>
          <div className="relative">
            <select
              id="face-camera-select"
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
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          onClick={() => {
            setError(null);
            loadModels().then(refreshDevices).catch(() => null);
            startCamera().catch((err: any) => setError(err?.message || "Camera failed to start."));
          }}
        >
          Enable Camera
        </Button>
        <Button onClick={handleVerify} disabled={verifying}>
          {verifying ? "Verifying..." : "Verify with Face"}
        </Button>
      </div>
    </Card>
  );
}
