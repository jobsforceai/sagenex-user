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
  
  // Face verification state
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, []);

  // Check enrollment status
  useEffect(() => {
    const checkEnrollment = async () => {
      try {
        const res = await getBiometricsStatus();
        if (!res?.error) {
          setEnrolled(Boolean(res.enrolled));
        }
      } catch (err) {
        console.error('Failed to check enrollment:', err);
      }
    };
    if (isOpen) {
      checkEnrollment();
    }
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
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera access is not supported in this browser");
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
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
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }

    detectionIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || !faceApiRef.current || !modelsReady) return;

      try {
        const detections = await faceApiRef.current
          .detectSingleFace(videoRef.current, new faceApiRef.current.TinyFaceDetectorOptions())
          .withFaceLandmarks();

        if (detections) {
          setHelperText("Hold still...");
        } else {
          setHelperText("Position your face inside the frame");
        }
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

      const result = await verifyFaceEmbedding({
        embedding,
        purpose: "KYC",
        livenessScore,
        meta: { note: "kyc-verification" },
      });

      if (result.error) {
        setError(result.error);
        setVerifying(false);
        setHelperText("Position your face inside the frame");
        return;
      }

      if (result.passed && result.verificationId) {
        setVerificationId(result.verificationId);
        stopCamera();
        if (detectionIntervalRef.current) {
          clearInterval(detectionIntervalRef.current);
        }
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
    if (verificationId) {
      onComplete(verificationId);
      onClose();
    }
  };

  const handleClose = () => {
    stopCamera();
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }
    setCurrentStep('intro');
    setError(null);
    setCameraError(null);
    setVerificationId(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {/* Close button - only show on intro and success steps */}
      {(currentStep === 'intro' || currentStep === 'success') && (
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>
      )}

      <div className="w-full h-full flex items-center justify-center p-4 sm:p-8">
        {/* STEP 1: INTRO / CONSENT */}
        {currentStep === 'intro' && (
          <div className="max-w-2xl w-full space-y-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Shield className="w-10 h-10 text-emerald-400" />
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                Quick identity check
              </h1>
              <p className="text-xl text-gray-400">
                This takes about 10 seconds and unlocks document upload
              </p>
            </div>

            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-8 space-y-6 text-left">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-1">
                    <Shield className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Prevents identity fraud</h3>
                    <p className="text-sm text-gray-400">
                      We verify it's really you submitting documents
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-1">
                    <Lock className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Required by regulation</h3>
                    <p className="text-sm text-gray-400">
                      Financial services must verify customer identity
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Face scan is used only for verification</h3>
                    <p className="text-sm text-gray-400">
                      Your biometric data is encrypted and never shared
                    </p>
                  </div>
                </div>
              </div>

              {!enrolled && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-2 flex-1">
                      <p className="text-sm text-amber-200">
                        You need to enroll your face first before you can verify.
                      </p>
                      <a
                        href="/face-test?mode=enroll&next=/kyc"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-amber-400 hover:text-amber-300"
                      >
                        Enroll your face now →
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 flex flex-col items-center">
              <Button
                onClick={handleStartVerification}
                disabled={!enrolled}
                className="w-full max-w-md h-14 text-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start verification
              </Button>

              <button
                onClick={() => setShowLearnMore(!showLearnMore)}
                className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
              >
                {showLearnMore ? 'Hide details' : 'Learn more'}
              </button>

              {showLearnMore && (
                <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-6 text-left space-y-3 max-w-2xl mx-auto">
                  <h4 className="font-semibold text-white">How it works</h4>
                  <p className="text-sm text-gray-400">
                    We'll ask you to position your face in front of the camera. Our system will capture 
                    your facial features and compare them with your enrolled face template. This ensures 
                    that the person uploading documents is the same person who created the account.
                  </p>
                  <p className="text-sm text-gray-400">
                    The entire process is encrypted, secure, and complies with data protection regulations.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: FACE VERIFICATION (CAMERA ACTIVE) */}
        {currentStep === 'face-scan' && (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <div className="w-full max-w-3xl space-y-6">
              {/* Camera view */}
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
                <video
                  ref={videoRef}
                  className="absolute inset-0 h-full w-full object-cover scale-x-[-1]"
                  autoPlay
                  muted
                  playsInline
                />
                
                {/* Oval face guide */}
                {cameraReady && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative w-72 h-96">
                      <div className="absolute inset-0 border-4 border-emerald-400/60 rounded-full" 
                           style={{ 
                             boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                           }} 
                      />
                    </div>
                  </div>
                )}

                {/* Loading state */}
                {!cameraReady && !cameraError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-white">Starting camera...</p>
                    </div>
                  </div>
                )}

                {/* Camera error */}
                {cameraError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/90">
                    <div className="text-center space-y-6 max-w-md px-6">
                      <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
                        <AlertCircle className="w-8 h-8 text-red-400" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-white">Camera access needed</h3>
                        <p className="text-gray-400">{cameraError}</p>
                      </div>
                      <div className="space-y-3">
                        <Button
                          onClick={startCamera}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
                        >
                          Try again
                        </Button>
                        <Button
                          onClick={handleClose}
                          variant="outline"
                          className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
                        >
                          Go back
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Instructions and verify button */}
              {cameraReady && (
                <div className="space-y-4 flex flex-col items-center">
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-white mb-2">
                      {helperText}
                    </p>
                    {error && (
                      <p className="text-sm text-red-400">{error}</p>
                    )}
                  </div>

                  <Button
                    onClick={handleVerify}
                    disabled={verifying || !modelsReady}
                    className="w-full max-w-md h-14 text-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {verifying ? (
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Verifying...
                      </span>
                    ) : (
                      'Verify my face'
                    )}
                  </Button>

                  {!modelsReady && (
                    <p className="text-center text-sm text-gray-400">
                      Loading face detection models...
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS CONFIRMATION */}
        {currentStep === 'success' && (
          <div className="max-w-2xl w-full space-y-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-14 h-14 text-emerald-400" />
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                Face verified successfully
              </h1>
              <p className="text-xl text-gray-400">
                You can now upload your documents
              </p>
            </div>

            <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-2xl p-6">
              <div className="flex items-center gap-3 justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <p className="text-emerald-200">
                  Your identity has been verified and secured
                </p>
              </div>
            </div>

            <Button
              onClick={handleComplete}
              className="w-full max-w-md mx-auto h-14 text-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
            >
              Continue to document upload
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
