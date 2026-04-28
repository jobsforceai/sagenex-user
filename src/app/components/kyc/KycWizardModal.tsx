"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Shield, Lock, CheckCircle2, X, AlertCircle } from 'lucide-react';
import { getBiometricsStatus, verifyFaceEmbedding } from '@/actions/user';

const MODEL_PATH = "/models/face-api";

interface KycWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (verificationId: string) => void;
}

type WizardStep = 'intro' | 'face-scan' | 'success';

export default function KycWizardModal({ isOpen, onClose, onComplete }: KycWizardModalProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('intro');
  const [showLearnMore, setShowLearnMore] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceApiRef = useRef<typeof import("face-api.js") | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [enrolled, setEnrolled] = useState(false);
  const [modelsReady, setModelsReady] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [helperText, setHelperText] = useState("Position your face inside the frame");
  const [verificationId, setVerificationId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      stopCamera();
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    const checkEnrollment = async () => {
      try {
        const res = await getBiometricsStatus();
        if (!res?.error) setEnrolled(Boolean(res.enrolled));
      } catch (err) {
        console.error('Failed to check enrollment:', err);
      }
    };
    if (isOpen) checkEnrollment();
  }, [isOpen]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  };

  const loadModels = async () => {
    if (modelsReady) return;
    try {
      const faceapi = await import("face-api.js");
      faceApiRef.current = faceapi;
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_PATH),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_PATH),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_PATH),
      ]);
      setModelsReady(true);
    } catch (err) {
      console.error("Model loading failed:", err);
      setError("Failed to load face detection models");
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera access is not supported in this browser");
      if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise<void>((resolve) => {
          if (!videoRef.current) return resolve();
          videoRef.current.onloadedmetadata = () => resolve();
        });
        await videoRef.current.play();
        setCameraReady(true);
        startFaceDetection();
      }
    } catch (err: any) {
      console.error("Camera start failed:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError("Camera permission denied. Please allow camera access and try again.");
      } else {
        setCameraError(err?.message || "Failed to start camera");
      }
    }
  };

  const startFaceDetection = () => {
    if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    detectionIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || !faceApiRef.current || !modelsReady) return;
      try {
        const detections = await faceApiRef.current
          .detectSingleFace(videoRef.current, new faceApiRef.current.TinyFaceDetectorOptions())
          .withFaceLandmarks();
        if (detections) setHelperText("Hold still...");
        else setHelperText("Position your face inside the frame");
      } catch (err) {
        console.error("Detection error:", err);
      }
    }, 500);
  };

  const handleVerify = async () => {
    if (!videoRef.current || !faceApiRef.current || !modelsReady) {
      setError("Face detection not ready");
      return;
    }
    setVerifying(true);
    setError(null);
    setHelperText("Analyzing...");
    try {
      const detection = await faceApiRef.current
        .detectSingleFace(videoRef.current, new faceApiRef.current.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();
      if (!detection) {
        setError("No face detected. Please position your face clearly in the frame.");
        setVerifying(false);
        setHelperText("Position your face inside the frame");
        return;
      }
      const embedding = Array.from(detection.descriptor);
      const livenessScore = (detection as any)?.detection?.score ?? 0.8;
      const result = await verifyFaceEmbedding({ embedding, purpose: "KYC", livenessScore, meta: { note: "kyc-verification" } });
      if (result.error) {
        setError(result.error);
        setVerifying(false);
        setHelperText("Position your face inside the frame");
        return;
      }
      if (result.passed && result.verificationId) {
        setVerificationId(result.verificationId);
        stopCamera();
        if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
        setCurrentStep('success');
      } else {
        setError("Face verification failed. Please try again.");
        setHelperText("Position your face inside the frame");
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      setError(err?.message || "Verification failed");
      setHelperText("Position your face inside the frame");
    } finally {
      setVerifying(false);
    }
  };

  const handleStartVerification = async () => {
    setCurrentStep('face-scan');
    await loadModels();
    await startCamera();
  };

  const handleComplete = () => {
    if (verificationId) { onComplete(verificationId); onClose(); }
  };

  const handleClose = () => {
    stopCamera();
    if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    setCurrentStep('intro');
    setError(null);
    setCameraError(null);
    setVerificationId(null);
    onClose();
  };

  if (!isOpen) return null;

  const isCameraStep = currentStep === 'face-scan';
  const overlayBg = isCameraStep ? 'bg-black' : 'bg-black/50 backdrop-blur-sm';

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${overlayBg}`}>
      {(currentStep === 'intro' || currentStep === 'success') && (
        <button
          onClick={handleClose}
          aria-label="Close"
          className="absolute right-6 top-6 z-10 rounded-full border border-slate-200 bg-white p-2 text-[#64748B] transition hover:bg-slate-50 hover:text-[#0F172A]"
        >
          <X className="h-5 w-5" />
        </button>
      )}

      <div className="flex h-full w-full items-center justify-center p-4 sm:p-8">
        {currentStep === 'intro' && (
          <div className="w-full max-w-2xl space-y-6 rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_25px_80px_rgba(15,23,42,0.18)] sm:p-10 text-center">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
                <Shield className="h-8 w-8 text-emerald-600" />
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-black tracking-tight text-[#0F172A] sm:text-4xl">Quick identity check</h1>
              <p className="text-base text-[#64748B] sm:text-lg">
                This takes about 10 seconds and unlocks document upload
              </p>
            </div>

            <div className="space-y-5 rounded-2xl border border-slate-200/70 bg-slate-50 p-6 text-left">
              {[
                { Icon: Shield, title: 'Prevents identity fraud', body: "We verify it's really you submitting documents" },
                { Icon: Lock, title: 'Required by regulation', body: 'Financial services must verify customer identity' },
                { Icon: CheckCircle2, title: 'Face scan is used only for verification', body: 'Your biometric data is encrypted and never shared' },
              ].map(({ Icon, title, body }) => (
                <div key={title} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-50">
                    <Icon className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0F172A]">{title}</h3>
                    <p className="text-sm text-[#64748B]">{body}</p>
                  </div>
                </div>
              ))}

              {!enrolled && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <div className="flex-1 space-y-2">
                      <p className="text-sm font-semibold text-amber-800">
                        You need to enroll your face first before you can verify.
                      </p>
                      <a
                        href="/face-test?mode=enroll&next=/kyc"
                        className="inline-flex items-center gap-2 text-sm font-bold text-amber-700 hover:text-amber-900"
                      >
                        Enroll your face now →
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col items-center space-y-4">
              <Button
                onClick={handleStartVerification}
                disabled={!enrolled}
                className="h-12 w-full max-w-md rounded-xl bg-emerald-600 text-base font-bold text-white shadow-[0_10px_30px_rgba(5,150,105,0.25)] hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Start verification
              </Button>

              <button
                onClick={() => setShowLearnMore(!showLearnMore)}
                className="text-sm font-semibold text-[#64748B] transition hover:text-[#0F172A]"
              >
                {showLearnMore ? 'Hide details' : 'Learn more'}
              </button>

              {showLearnMore && (
                <div className="mx-auto max-w-2xl space-y-3 rounded-2xl border border-slate-200/70 bg-slate-50 p-5 text-left">
                  <h4 className="font-bold text-[#0F172A]">How it works</h4>
                  <p className="text-sm text-[#475569]">
                    We'll ask you to position your face in front of the camera. Our system will capture
                    your facial features and compare them with your enrolled face template. This ensures
                    that the person uploading documents is the same person who created the account.
                  </p>
                  <p className="text-sm text-[#475569]">
                    The entire process is encrypted, secure, and complies with data protection regulations.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 'face-scan' && (
          <div className="flex h-full w-full flex-col items-center justify-center">
            <div className="w-full max-w-3xl space-y-6">
              <div className="relative h-[72vh] w-full overflow-hidden rounded-3xl bg-black sm:h-[75vh] lg:h-[70vh]">
                <video ref={videoRef} className="absolute inset-0 h-full w-full -scale-x-100 object-cover" autoPlay muted playsInline />

                {cameraReady && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="relative h-[28rem] w-80 sm:h-[32rem] sm:w-96">
                      <div className="absolute inset-0 rounded-full border-4 border-emerald-400/60" style={{ boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)' }} />
                    </div>
                  </div>
                )}

                {!cameraReady && !cameraError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                    <div className="space-y-4 text-center">
                      <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                      <p className="text-white">Starting camera...</p>
                    </div>
                  </div>
                )}

                {cameraError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/90">
                    <div className="max-w-md space-y-6 px-6 text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/20">
                        <AlertCircle className="h-8 w-8 text-rose-400" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold text-white">Camera access needed</h3>
                        <p className="text-zinc-300">{cameraError}</p>
                      </div>
                      <div className="space-y-3">
                        <Button onClick={startCamera} className="h-11 w-full rounded-xl bg-emerald-600 font-bold text-white hover:bg-emerald-700">
                          Try again
                        </Button>
                        <Button onClick={handleClose} variant="outline" className="h-11 w-full rounded-xl border-white/20 bg-transparent font-bold text-white hover:bg-white/10">
                          Go back
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {cameraReady && (
                <div className="flex flex-col items-center space-y-4">
                  <div className="text-center">
                    <p className="mb-2 text-2xl font-black text-white">{helperText}</p>
                    {error && <p className="text-sm font-semibold text-rose-400">{error}</p>}
                  </div>
                  <Button
                    onClick={handleVerify}
                    disabled={verifying || !modelsReady}
                    className="h-14 w-full max-w-md rounded-xl bg-emerald-600 text-lg font-bold text-white shadow-[0_10px_30px_rgba(5,150,105,0.35)] hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {verifying ? (
                      <span className="flex items-center gap-2">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Verifying...
                      </span>
                    ) : (
                      'Verify my face'
                    )}
                  </Button>
                  {!modelsReady && (
                    <p className="text-center text-sm text-zinc-300">Loading face detection models...</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 'success' && (
          <div className="w-full max-w-2xl space-y-6 rounded-3xl border border-slate-200/70 bg-white p-6 text-center shadow-[0_25px_80px_rgba(15,23,42,0.18)] sm:p-10">
            <div className="flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50">
                <CheckCircle2 className="h-12 w-12 text-emerald-600" />
              </div>
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-black tracking-tight text-[#0F172A] sm:text-4xl">Face verified successfully</h1>
              <p className="text-base text-[#64748B] sm:text-lg">You can now upload your documents</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-center justify-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <p className="font-bold text-emerald-700">Your identity has been verified and secured</p>
              </div>
            </div>
            <Button
              onClick={handleComplete}
              className="mx-auto h-12 w-full max-w-md rounded-xl bg-emerald-600 text-base font-bold text-white shadow-[0_10px_30px_rgba(5,150,105,0.25)] hover:bg-emerald-700"
            >
              Continue to document upload
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
