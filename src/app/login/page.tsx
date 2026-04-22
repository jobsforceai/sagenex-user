"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { registerUser, loginOtp, verifyEmail, login, verifyEmailOtp, passwordStatus, nomineeLogin } from "@/actions/auth";
import { Mail, User, Phone, KeyRound, ArrowLeft, LogIn, UserPlus, ShieldCheck, Loader2, ShieldAlert } from "lucide-react";
import Image from "next/image";

type View = "identify" | "main" | "email-login" | "email-signup" | "otp" | "password-login" | "nominee-login" | "face-stepup";

type AuthResponse = {
  token: string;
  user: {
    userId: string;
    fullName: string;
    email: string;
    hasPasswordSet?: boolean;
    role?: "nominee";
  };
};

function Login() {
  const { login: authLogin } = useAuth();
  const searchParams = useSearchParams();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceApiRef = useRef<typeof import("face-api.js") | null>(null);
  const MODEL_PATH = "/models/face-api";
  const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";
  
  const [view, setView] = useState<View>("identify");
  const [previousView, setPreviousView] = useState<View>("identify");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAuth, setPendingAuth] = useState<AuthResponse | null>(null);
  const [faceError, setFaceError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [modelsReady, setModelsReady] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [verifyingFace, setVerifyingFace] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [challengeExpected, setChallengeExpected] = useState(0);
  const [challengeExpiresAt, setChallengeExpiresAt] = useState<string | null>(null);
  const [blinkEvents, setBlinkEvents] = useState<string[]>([]);
  const [livenessError, setLivenessError] = useState<string | null>(null);
  const [challengeCountdown, setChallengeCountdown] = useState<number | null>(null);
  const [debugEar, setDebugEar] = useState<number | null>(null);
  const [debugBaseline, setDebugBaseline] = useState<number | null>(null);
  const [debugFaceDetected, setDebugFaceDetected] = useState(false);
  const [debugClosedFrames, setDebugClosedFrames] = useState(0);
  const [debugOpenFrames, setDebugOpenFrames] = useState(0);
  const [debugDetector, setDebugDetector] = useState<string>("—");
  const [hasPasswordSet, setHasPasswordSet] = useState<boolean | null>(null);
  const [passwordStatusEmail, setPasswordStatusEmail] = useState<string | null>(null);
  const [isVerifyFlow, setIsVerifyFlow] = useState(false);
  const [isAccountBlocked, setIsAccountBlocked] = useState(false);

  const blinkMonitorRef = useRef<NodeJS.Timeout | null>(null);
  const blinkingRef = useRef(false);
  const blinkEventsRef = useRef<string[]>([]);
  const closedFramesRef = useRef(0);
  const openFramesRef = useRef(0);
  const openEarRef = useRef<number | null>(null);
  const earWindowRef = useRef<number[]>([]);
  const blinkSyncRef = useRef<NodeJS.Timeout | null>(null);
  const blinkMonitorActiveRef = useRef<string | null>(null);

  // Form fields
  const [sponsorId, setSponsorId] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nomineeUserId, setNomineeUserId] = useState("");
  const [nomineePhrase, setNomineePhrase] = useState("");

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setSponsorId(ref);
    }
  }, [searchParams]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (view !== "face-stepup" && streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setCameraReady(false);
    }
  }, [view]);

  useEffect(() => {
    if (view !== "face-stepup") {
      setChallengeId(null);
      setChallengeExpected(0);
      setChallengeExpiresAt(null);
      setBlinkEvents([]);
      setLivenessError(null);
      setChallengeCountdown(null);
      blinkEventsRef.current = [];
      blinkingRef.current = false;
      closedFramesRef.current = 0;
      openFramesRef.current = 0;
      openEarRef.current = null;
      earWindowRef.current = [];
      setDebugDetector("—");
      if (blinkMonitorRef.current) {
        clearInterval(blinkMonitorRef.current);
        blinkMonitorRef.current = null;
      }
      if (blinkSyncRef.current) {
        clearInterval(blinkSyncRef.current);
        blinkSyncRef.current = null;
      }
      blinkMonitorActiveRef.current = null;
    }
  }, [view]);

  useEffect(() => {
    const verify = searchParams.get("verify");
    if (verify) {
      setIsVerifyFlow(true);
      setError(null);
      setNeedsVerification(false);
      setMessage("Your email is not verified. Enter your email to receive a verification code.");
      setView("identify");
      return;
    }
    setIsVerifyFlow(false);
  }, [searchParams]);

  const changeView = (newView: View) => {
    setPreviousView(view);
    setView(newView);
  }

  const isBlockedError = (value: string | null | undefined) =>
    typeof value === "string" && /blocked by admin/i.test(value);

  const setAuthError = (value: string | null) => {
    setError(value);
    setIsAccountBlocked(isBlockedError(value));
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (isAccountBlocked) {
      setIsAccountBlocked(false);
    }
    if (passwordStatusEmail && passwordStatusEmail !== value) {
      setHasPasswordSet(null);
      setPasswordStatusEmail(null);
    }
  };

  const resolvePasswordStatus = async (data: AuthResponse) => {
    if (typeof data.user.hasPasswordSet === "boolean") {
      return data;
    }

    if (typeof hasPasswordSet === "boolean" && passwordStatusEmail === email) {
      return { ...data, user: { ...data.user, hasPasswordSet } };
    }

    if (!email) return data;

    const status = await passwordStatus(email);
    if (!status?.error && typeof status.hasPasswordSet === "boolean") {
      setHasPasswordSet(status.hasPasswordSet);
      setPasswordStatusEmail(email);
      return { ...data, user: { ...data.user, hasPasswordSet: status.hasPasswordSet } };
    }

    return data;
  };

  const fetchBiometricsStatus = async (token: string) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/user/biometrics/status`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const responseText = await res.text();
    try {
      return JSON.parse(responseText);
    } catch {
      return { error: "Invalid biometrics status response." };
    }
  };

  const verifyFaceEmbedding = async (
    token: string,
    embedding: number[],
    payload: { challengeId?: string | null; blinkEvents?: string[] } = {}
  ) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/user/biometrics/verify`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        embedding,
        purpose: "LOGIN",
        challengeId: payload.challengeId ?? challengeId,
        blinkEvents: payload.blinkEvents ?? blinkEvents,
      }),
    });
    const responseText = await res.text();
    try {
      return JSON.parse(responseText);
    } catch {
      return { error: "Invalid face verification response." };
    }
  };

  const requestBlinkChallenge = async (token: string) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/user/biometrics/challenge`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ purpose: "LOGIN" }),
    });
    const responseText = await res.text();
    try {
      return JSON.parse(responseText);
    } catch {
      return { error: "Invalid challenge response." };
    }
  };

  const logBiometricsBypass = async (token: string, reason: string) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/user/biometrics/bypass`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason }),
    });
    const responseText = await res.text();
    try {
      return JSON.parse(responseText);
    } catch {
      return { error: "Invalid bypass response." };
    }
  };

  const handleAuthSuccess = async (data: AuthResponse) => {
    const resolvedData = await resolvePasswordStatus(data);
    const token = resolvedData.token;
    const status = await fetchBiometricsStatus(token);
    if (status?.approved === true) {
      setPendingAuth(resolvedData);
      setFaceError(null);
      setCameraError(null);
      changeView("face-stepup");
      return;
    }
    authLogin(resolvedData);
  };

  const loadFaceModels = async () => {
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

  const getEyeAspectRatio = (eye: Array<{ x: number; y: number }>) => {
    if (eye.length < 6) return 0;
    const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
      Math.hypot(a.x - b.x, a.y - b.y);
    const vertical1 = dist(eye[1], eye[5]);
    const vertical2 = dist(eye[2], eye[4]);
    const horizontal = dist(eye[0], eye[3]);
    if (horizontal === 0) return 0;
    return (vertical1 + vertical2) / (2 * horizontal);
  };

  const startBlinkMonitor = async (
    overrideChallengeId?: string | null,
    overrideExpected?: number
  ) => {
    const activeChallengeId = overrideChallengeId ?? challengeId;
    const activeExpected = overrideExpected ?? challengeExpected;
    if (!activeChallengeId || !activeExpected) return;
    if (blinkMonitorActiveRef.current === activeChallengeId) return;
    blinkMonitorActiveRef.current = activeChallengeId;
    await loadFaceModels();
    if (!cameraReady) {
      await startCamera();
    }
    if (blinkMonitorRef.current) {
      clearInterval(blinkMonitorRef.current);
    }
    if (blinkSyncRef.current) {
      clearInterval(blinkSyncRef.current);
    }
    blinkingRef.current = false;
    blinkEventsRef.current = [];
    closedFramesRef.current = 0;
    openFramesRef.current = 0;
    openEarRef.current = null;
    earWindowRef.current = [];
    setBlinkEvents([]);
    const minClosedFrames = 1;
    const minOpenFrames = 1;
    const maxWindow = 30;
    console.log("[blink] monitor started", activeChallengeId);
    if (blinkSyncRef.current) {
      clearInterval(blinkSyncRef.current);
    }
    blinkSyncRef.current = setInterval(() => {
      setBlinkEvents([...blinkEventsRef.current]);
    }, 500);
    blinkMonitorRef.current = setInterval(async () => {
      const faceapi = faceApiRef.current;
      const video = videoRef.current;
      if (!faceapi || !video || video.readyState < 2) return;
      try {
        const tinyDetections = await faceapi
          .detectAllFaces(
            video,
            new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.2 })
          )
          .withFaceLandmarks();
        const detection = tinyDetections?.[0];
        setDebugDetector(detection ? "tiny" : "none");
        if (!detection) {
          setDebugFaceDetected(false);
          return;
        }
        setDebugFaceDetected(true);
        const left = detection.landmarks.getLeftEye();
        const right = detection.landmarks.getRightEye();
        const ear = (getEyeAspectRatio(left) + getEyeAspectRatio(right)) / 2;
        if (ear > 0.1) {
          earWindowRef.current = [...earWindowRef.current, ear].slice(-maxWindow);
        }
        const baseline = earWindowRef.current.length
          ? Math.max(...earWindowRef.current)
          : ear;
        openEarRef.current = baseline;
        setDebugEar(ear);
        setDebugBaseline(baseline);
        // Detect a blink when eye openness drops ~15% from recent max.
        const closedThreshold = baseline * 0.85;
        const openThreshold = baseline * 0.92;

        if (ear < closedThreshold) {
          closedFramesRef.current += 1;
          openFramesRef.current = 0;
        } else if (ear > openThreshold) {
          openFramesRef.current += 1;
        }
        setDebugClosedFrames(closedFramesRef.current);
        setDebugOpenFrames(openFramesRef.current);

        if (!blinkingRef.current && closedFramesRef.current >= minClosedFrames) {
          blinkingRef.current = true;
        }

        if (blinkingRef.current && openFramesRef.current >= minOpenFrames) {
          blinkingRef.current = false;
          closedFramesRef.current = 0;
          openFramesRef.current = 0;
          const ts = new Date().toISOString();
          blinkEventsRef.current = [...blinkEventsRef.current, ts];
          setBlinkEvents(blinkEventsRef.current);
          setDebugClosedFrames(0);
          setDebugOpenFrames(0);
          console.log("[blink] event", ts, "total", blinkEventsRef.current.length);
        }
      } catch (err) {
        console.log("[blink] detection error", err);
        // ignore transient detection errors
      }
    }, 120);
  };

  const resetBlinkTracking = async () => {
    blinkEventsRef.current = [];
    blinkingRef.current = false;
    closedFramesRef.current = 0;
    openFramesRef.current = 0;
    openEarRef.current = null;
    earWindowRef.current = [];
    setBlinkEvents([]);
    setLivenessError("Blink once to continue.");
    setDebugDetector("—");
    blinkMonitorActiveRef.current = null;
    await startBlinkMonitor();
  };

  const startCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera access is not supported in this browser.");
      return;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    try {
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
        // Intentionally do not auto-start blink detection here.
        // The user can trigger it via "Retry blink detection" to avoid camera box loops.
      }
    } catch (err: any) {
      const name = err?.name || "UnknownError";
      const rawMessage = err?.message || "Failed to start camera.";
      const msg =
        name === "NotAllowedError" || name === "PermissionDeniedError"
          ? "Camera permission denied. Please allow camera access in your browser settings."
          : name === "NotFoundError"
          ? "No camera device found. Connect a camera and try again."
          : name === "NotReadableError"
          ? "Camera is in use by another app. Close other apps and retry."
          : name === "OverconstrainedError"
          ? "Camera constraints are not supported. Try a different camera."
          : name === "SecurityError"
          ? "Camera access blocked. Use HTTPS or localhost."
          : rawMessage;
      console.error("Camera start failed:", { name, rawMessage });
      setCameraError(`${msg} (${name})`);
    }
  };

  const handleFaceVerify = async () => {
    if (!pendingAuth) return;
    setFaceError(null);
    setLivenessError(null);
    setVerifyingFace(true);
    try {
      await loadFaceModels();
      if (!cameraReady) {
        await startCamera();
      }
      if (!challengeId) {
        const challenge = await requestBlinkChallenge(pendingAuth.token);
        if (challenge?.error) {
          setLivenessError(challenge.error);
          return;
        }
        setChallengeId(challenge.challengeId);
        setChallengeExpected(challenge.expected || 1);
        setChallengeExpiresAt(challenge.expiresAt || null);
        await startBlinkMonitor(challenge.challengeId, challenge.expected || 1);
        setLivenessError("Blink once to continue.");
        return;
      }
      if (challengeExpected > 0 && blinkEventsRef.current.length < challengeExpected) {
        setLivenessError(
          `Please blink ${challengeExpected} time${challengeExpected > 1 ? "s" : ""}.`
        );
        return;
      }
      const faceapi = faceApiRef.current;
      const video = videoRef.current;
      if (!faceapi || !video) {
        throw new Error("Face detection not ready.");
      }
      const detection = await faceapi
        .detectSingleFace(
          video,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.2 })
        )
        .withFaceLandmarks()
        .withFaceDescriptor();
      if (!detection) {
        throw new Error("No face detected. Please look at the camera and try again.");
      }
      const embedding = Array.from(detection.descriptor);
      const result = await verifyFaceEmbedding(pendingAuth.token, embedding, {
        challengeId,
        blinkEvents: [...blinkEventsRef.current],
      });
      if (result?.error) {
        if (/challenge/i.test(result.error)) {
          setLivenessError(result.error);
          setChallengeId(null);
          setChallengeExpected(0);
          setChallengeExpiresAt(null);
          setBlinkEvents([]);
          blinkEventsRef.current = [];
          blinkingRef.current = false;
        } else {
          setFaceError(result.error);
        }
        return;
      }
      if (result?.passed) {
        authLogin(pendingAuth);
        return;
      }
      setFaceError("Face verification failed. Please try again.");
    } catch (err: any) {
      setFaceError(err?.message || "Face verification failed.");
    } finally {
      setVerifyingFace(false);
    }
  };

  useEffect(() => {
    if (!challengeExpiresAt) {
      setChallengeCountdown(null);
      return;
    }
    const timer = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.ceil((new Date(challengeExpiresAt).getTime() - Date.now()) / 1000)
      );
      setChallengeCountdown(remaining);
      if (remaining === 0 && challengeId) {
        setLivenessError("Challenge expired. Please try again.");
        setChallengeId(null);
        setChallengeExpected(0);
        setChallengeExpiresAt(null);
        setBlinkEvents([]);
        blinkEventsRef.current = [];
        blinkingRef.current = false;
        closedFramesRef.current = 0;
        openFramesRef.current = 0;
        openEarRef.current = null;
        earWindowRef.current = [];
        setDebugDetector("—");
        if (blinkMonitorRef.current) {
          clearInterval(blinkMonitorRef.current);
          blinkMonitorRef.current = null;
        }
        if (blinkSyncRef.current) {
          clearInterval(blinkSyncRef.current);
          blinkSyncRef.current = null;
        }
        blinkMonitorActiveRef.current = null;
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [challengeExpiresAt, challengeId]);

  useEffect(() => {
    // Auto-start disabled to avoid camera box reset loops.
    // Blink detection can be manually started via "Retry blink detection".
  }, []);

  const handleFaceBypass = async () => {
    if (!pendingAuth) return;
    setFaceError(null);
    const reason = "camera_permission_denied";
    const result = await logBiometricsBypass(pendingAuth.token, reason);
    if (result?.error) {
      setFaceError(result.error);
      return;
    }
    authLogin(pendingAuth);
  };

  const isAuthResponse = (data: unknown): data is AuthResponse => {
    if (!data || typeof data !== "object") return false;
    const candidate = data as AuthResponse;
    return (
      typeof candidate.token === "string" &&
      !!candidate.user &&
      typeof candidate.user.email === "string"
    );
  };

  const handleCheckPasswordStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setMessage(null);
    setNeedsVerification(false);
    setIsLoading(true);

    if (!email) {
      setAuthError("Email is required.");
      setIsLoading(false);
      return;
    }

    try {
      if (isVerifyFlow) {
        const data = await verifyEmailOtp(email);
        if (data.error) {
          setAuthError(data.error);
        } else {
          setMessage(data.message || "Verification OTP has been sent to your email.");
          changeView("otp");
        }
        return;
      }

      const status = await passwordStatus(email);
      if (status?.error) {
        setAuthError(status.error);
        return;
      }
      if (typeof status?.hasPasswordSet !== "boolean") {
        setAuthError("Unable to determine password status.");
        return;
      }

      setHasPasswordSet(status.hasPasswordSet);
      setPasswordStatusEmail(email);

      if (status.hasPasswordSet) {
        changeView("main");
      } else {
        setMessage("No password found for this account. Continue with OTP to sign in.");
        changeView("email-login");
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setMessage(null);
    setNeedsVerification(false);

    if (password !== confirmPassword) {
      setAuthError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
        setAuthError("Password must be at least 8 characters long.");
        return;
    }

    setIsLoading(true);

    if (!fullName || !email || !phone) {
        setAuthError("Full name, email, and phone number are required.");
        setIsLoading(false);
        return;
    }

    try {
        const data = await registerUser(fullName, email, phone, sponsorId, password);
        if (data.error) {
            setAuthError(data.error);
        } else {
            setMessage(data.message || "Registration successful. Please check your email for OTP.");
            changeView("otp");
        }
    } catch (err) {
        setAuthError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleEmailLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setMessage(null);
    setNeedsVerification(false);
    setIsLoading(true);

    if (!email) {
        setAuthError("Email is required.");
        setIsLoading(false);
        return;
    }

    try {
        const data = await loginOtp(email);
        if (data.error) {
            setAuthError(data.error);
            setNeedsVerification(/not verified/i.test(data.error));
        } else {
            setMessage(data.message || "Login OTP has been sent to your email.");
            changeView("otp");
        }
    } catch (err) {
        setAuthError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
        setIsLoading(false);
    }
  };

  const handlePasswordLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setNeedsVerification(false);
    setIsLoading(true);

    if (!email || !password) {
      setAuthError("Email and password are required.");
      setIsLoading(false);
      return;
    }

    try {
      const data = await login(email, password);
      if (data.error) {
        setAuthError(data.error);
        setNeedsVerification(/not verified/i.test(data.error));
      } else if (!isAuthResponse(data)) {
        setAuthError("An unexpected response was returned. Please try again.");
      } else {
        await handleAuthSuccess(data);
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setNeedsVerification(false);
    setIsLoading(true);

    if (!otp || !email) {
        setAuthError("Email and OTP are required.");
        setIsLoading(false);
        return;
    }

    try {
        const data = await verifyEmail(email, otp);
        if (data.error) {
            setAuthError(data.error);
        } else if (!isAuthResponse(data)) {
            setAuthError("An unexpected response was returned. Please try again.");
        } else {
            await handleAuthSuccess(data);
        }
    } catch (err) {
        setAuthError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleRequestVerificationOtp = async () => {
    setAuthError(null);
    setMessage(null);
    setIsLoading(true);

    if (!email) {
      setAuthError("Email is required.");
      setIsLoading(false);
      return;
    }

    try {
      const data = await verifyEmailOtp(email);
      if (data.error) {
        setAuthError(data.error);
      } else {
        setMessage(data.message || "Verification OTP has been sent to your email.");
        changeView("otp");
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderVerificationPrompt = () => {
    if (!needsVerification) return null;

    return (
      <div className="rounded-md border border-blue-900/60 bg-blue-950/30 p-3 text-center text-sm text-blue-100">
        <p className="mb-2">Your email is not verified yet. Send a verification code to continue.</p>
        <Button
          type="button"
          variant="outline"
          className="w-full border-blue-700 text-blue-100 hover:bg-blue-900/30"
          onClick={handleRequestVerificationOtp}
          disabled={isLoading}
        >
          Send verification code
        </Button>
      </div>
    );
  };

  const renderIdentifyView = () => (
    <form onSubmit={handleCheckPasswordStatus} className="space-y-4">
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          id="email-identify"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => handleEmailChange(e.target.value)}
          required
          className="bg-white border-[#e8e8e8] text-[#0a0a0a] pl-10 focus:border-[#C41E3A] rounded-xl"
          disabled={isLoading}
        />
      </div>
      <Button type="submit" className="w-full flex items-center gap-2 bg-[#C41E3A] hover:bg-[#a81831] text-white rounded-xl shadow-[0_2px_12px_rgba(196,30,58,0.25)]" disabled={isLoading}>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continue <LogIn className="h-4 w-4" /></>}
      </Button>
    </form>
  );

  const renderMainView = () => (
    <div className="space-y-3">
      {hasPasswordSet !== false && (
        <Button onClick={() => changeView("password-login")} className="w-full flex items-center gap-2 bg-[#C41E3A] hover:bg-[#a81831] text-white rounded-xl shadow-[0_2px_12px_rgba(196,30,58,0.25)]">
          <KeyRound className="h-4 w-4" /> Continue with Password
        </Button>
      )}
      <Button onClick={() => changeView("email-login")} variant="outline" className="w-full flex items-center gap-2 bg-transparent border-gray-600 hover:bg-gray-700">
        <Mail className="h-4 w-4" /> Continue with Email (OTP)
      </Button>
    </div>
  );

  const renderPasswordLoginView = () => (
    <form onSubmit={handlePasswordLoginSubmit} className="space-y-4">
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          id="email-password-login"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => handleEmailChange(e.target.value)}
          required
          className="bg-white border-[#e8e8e8] text-[#0a0a0a] pl-10 focus:border-[#C41E3A] rounded-xl"
          disabled={isLoading}
        />
      </div>
      <div className="relative">
        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          id="password-login"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="bg-white border-[#e8e8e8] text-[#0a0a0a] pl-10 focus:border-[#C41E3A] rounded-xl"
          disabled={isLoading}
        />
      </div>
      <Button type="submit" className="w-full flex items-center gap-2 bg-[#C41E3A] hover:bg-[#a81831] text-white rounded-xl shadow-[0_2px_12px_rgba(196,30,58,0.25)]" disabled={isLoading}>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Login <LogIn className="h-4 w-4" /></>}
      </Button>
      {renderVerificationPrompt()}
    </form>
  )

  const renderEmailLoginView = () => (
    <form onSubmit={handleEmailLoginSubmit} className="space-y-4">
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          id="email-login"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => handleEmailChange(e.target.value)}
          required
          className="bg-white border-[#e8e8e8] text-[#0a0a0a] pl-10 focus:border-[#C41E3A] rounded-xl"
          disabled={isLoading}
        />
      </div>
      <Button type="submit" className="w-full flex items-center gap-2 bg-[#C41E3A] hover:bg-[#a81831] text-white rounded-xl shadow-[0_2px_12px_rgba(196,30,58,0.25)]" disabled={isLoading}>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Send OTP <LogIn className="h-4 w-4" /></>}
      </Button>
      {renderVerificationPrompt()}
    </form>
  );

  const handleNomineeLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setMessage(null);
    setIsLoading(true);

    if (!nomineeUserId || !nomineePhrase) {
      setAuthError("User ID and nominee code are required.");
      setIsLoading(false);
      return;
    }

    try {
      const data = await nomineeLogin(nomineeUserId, nomineePhrase);
      if (data.error) {
        setAuthError(data.error);
      } else if (!isAuthResponse(data)) {
        setAuthError("An unexpected response was returned. Please try again.");
      } else {
        authLogin({
          ...data,
          user: {
            ...data.user,
            role: "nominee",
          },
        });
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderNomineeLoginView = () => (
    <form onSubmit={handleNomineeLoginSubmit} className="space-y-4">
      <div className="relative">
        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          id="nominee-user-id"
          type="text"
          placeholder="User ID (e.g., U123)"
          value={nomineeUserId}
          onChange={(e) => setNomineeUserId(e.target.value)}
          required
          className="bg-white border-[#e8e8e8] text-[#0a0a0a] pl-10 focus:border-[#C41E3A] rounded-xl"
          disabled={isLoading}
        />
      </div>
      <div className="relative">
        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          id="nominee-code"
          type="password"
          placeholder="Nominee code"
          value={nomineePhrase}
          onChange={(e) => setNomineePhrase(e.target.value)}
          required
          className="bg-white border-[#e8e8e8] text-[#0a0a0a] pl-10 focus:border-[#C41E3A] rounded-xl"
          disabled={isLoading}
        />
      </div>
      <Button type="submit" className="w-full flex items-center gap-2 bg-[#C41E3A] hover:bg-[#a81831] text-white rounded-xl shadow-[0_2px_12px_rgba(196,30,58,0.25)]" disabled={isLoading}>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Login as Nominee <LogIn className="h-4 w-4" /></>}
      </Button>
    </form>
  );

  const renderFaceStepUpView = () => (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-lg font-semibold text-white">Face verification required</h2>
        <p className="text-sm text-gray-400">
          Please verify your face to complete login.
        </p>
      </div>
      <div className="relative overflow-hidden rounded-2xl border border-gray-800 bg-black">
        <div className="relative w-full h-[50vh] min-h-80">
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            muted
            playsInline
          />
          {!cameraReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-sm text-gray-300">
              Camera not started
            </div>
          )}
        </div>
      </div>
      {(faceError || cameraError) && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {faceError || cameraError}
        </div>
      )}
      {(challengeId || livenessError) && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
          <div className="flex items-center justify-between">
            <span>Blink check</span>
            {challengeCountdown !== null && (
              <span className="text-emerald-200/80">{challengeCountdown}s left</span>
            )}
          </div>
          <p className="mt-1 text-emerald-200/80">
            {livenessError
              ? livenessError
              : `Detected ${blinkEvents.length} / ${challengeExpected} blink${
                  challengeExpected === 1 ? "" : "s"
                }.`}
          </p>
          <div className="mt-2 rounded-md border border-emerald-500/20 bg-black/30 px-2 py-1 text-[10px] text-emerald-200/80">
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              <span>Face: {debugFaceDetected ? "yes" : "no"}</span>
              <span>Models: {modelsReady ? "ready" : "loading"}</span>
              <span>Camera: {cameraReady ? "ready" : "off"}</span>
              <span>Detector: {debugDetector}</span>
              <span>EAR: {debugEar !== null ? debugEar.toFixed(3) : "—"}</span>
              <span>Base: {debugBaseline !== null ? debugBaseline.toFixed(3) : "—"}</span>
              <span>Closed: {debugClosedFrames}</span>
              <span>Open: {debugOpenFrames}</span>
            </div>
          </div>
          <button
            type="button"
            className="mt-2 text-[11px] underline text-emerald-100 hover:text-white"
            onClick={() => {
              resetBlinkTracking().catch(() => null);
            }}
          >
            Retry blink detection
          </button>
        </div>
      )}
      <div className="grid gap-2">
        <Button
          type="button"
          variant="outline"
          className="w-full border-[#e8e8e8] text-zinc-700 hover:bg-[#f5f5f5] rounded-xl"
          onClick={() => {
            setCameraError(null);
            loadFaceModels()
              .then(startCamera)
              .catch((err: any) => setCameraError(err?.message || "Failed to start camera."));
          }}
          disabled={cameraReady}
        >
          {cameraReady ? "Camera Ready" : "Enable Camera"}
        </Button>
        <Button
          type="button"
          className="w-full bg-[#C41E3A] hover:bg-[#a81831] text-white rounded-xl shadow-[0_2px_12px_rgba(196,30,58,0.25)]"
          onClick={handleFaceVerify}
          disabled={verifyingFace}
        >
          {verifyingFace ? "Verifying..." : "Verify Face"}
        </Button>
      </div>
      <div className="rounded-lg border border-gray-800 bg-black/40 px-4 py-3 text-xs text-gray-300">
        <p className="font-semibold text-zinc-700">Camera not working?</p>
        <p className="mt-1 text-gray-400">
          No worries. You can continue to login and we’ll log a camera bypass for now.
        </p>
        <Button
          type="button"
          variant="ghost"
          className="mt-2 w-full justify-center text-zinc-500 hover:text-[#C41E3A] hover:bg-[#f5f5f5]"
          onClick={handleFaceBypass}
        >
          Continue without camera
        </Button>
      </div>
    </div>
  );

  const renderEmailSignUpView = () => (
    <form onSubmit={handleSignUpSubmit} className="space-y-4">
        <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Full Name" id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="bg-white border-[#e8e8e8] text-[#0a0a0a] pl-10 focus:border-[#C41E3A] rounded-xl" disabled={isLoading} />
        </div>
        <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Email" id="email-signup" type="email" value={email} onChange={(e) => handleEmailChange(e.target.value)} required className="bg-white border-[#e8e8e8] text-[#0a0a0a] pl-10 focus:border-[#C41E3A] rounded-xl" disabled={isLoading} />
        </div>
        <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Password" id="password-signup" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-white border-[#e8e8e8] text-[#0a0a0a] pl-10 focus:border-[#C41E3A] rounded-xl" disabled={isLoading} />
        </div>
        <div className="relative">
            <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Confirm Password" id="confirmPassword-signup" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="bg-white border-[#e8e8e8] text-[#0a0a0a] pl-10 focus:border-[#C41E3A] rounded-xl" disabled={isLoading} />
        </div>
        <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Phone" id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required className="bg-white border-[#e8e8e8] text-[#0a0a0a] pl-10 focus:border-[#C41E3A] rounded-xl" disabled={isLoading} />
        </div>
        <div className="relative">
            <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Referral Code (Optional)" id="sponsorId-signup" value={sponsorId} onChange={(e) => setSponsorId(e.target.value)} className="bg-white border-[#e8e8e8] text-[#0a0a0a] pl-10 focus:border-[#C41E3A] rounded-xl" disabled={isLoading} />
        </div>
        <Button type="submit" className="w-full flex items-center gap-2 bg-[#C41E3A] hover:bg-[#a81831] text-white rounded-xl shadow-[0_2px_12px_rgba(196,30,58,0.25)]" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Create Account <UserPlus className="h-4 w-4" /></>}
        </Button>
    </form>
  );

  const renderOtpView = () => (
    <form onSubmit={handleOtpSubmit} className="space-y-4">
        <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="6-Digit OTP" id="otp" type="text" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} required className="bg-white border-[#e8e8e8] text-[#0a0a0a] text-center tracking-[0.5em] pl-10 focus:border-[#C41E3A] rounded-xl" disabled={isLoading} />
        </div>
        <Button type="submit" className="w-full flex items-center gap-2 bg-[#C41E3A] hover:bg-[#a81831] text-white rounded-xl shadow-[0_2px_12px_rgba(196,30,58,0.25)]" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Verify <ShieldCheck className="h-4 w-4" /></>}
        </Button>
    </form>
  );

  const handleBack = () => {
    setAuthError(null);
    setMessage(null);
    setNeedsVerification(false);
    if (view === "otp") {
      changeView(previousView);
      return;
    }
    if (view === "main") {
      changeView("identify");
      return;
    }
    if (view === "email-login" || view === "password-login") {
      changeView(hasPasswordSet === false ? "identify" : "main");
      return;
    }
    if (view === "nominee-login") {
      changeView("identify");
      return;
    }
    changeView("identify");
  };

  const renderView = () => {
    let title, description, form;
    switch (view) {
      case "identify":
        title = "Welcome Back";
        description = isVerifyFlow
          ? "Enter your email to receive a verification code."
          : "Enter your email to continue.";
        form = renderIdentifyView();
        break;
      case "password-login":
        title = "Sign In with Password";
        description = "Enter your email and password to log in.";
        form = renderPasswordLoginView();
        break;
      case "email-login":
        title = "Sign In with OTP";
        description = "Enter your email to receive a login code.";
        form = renderEmailLoginView();
        break;
      case "email-signup":
        title = "Create an Account";
        description = "Get started with Sagenex today.";
        form = renderEmailSignUpView();
        break;
      case "nominee-login":
        title = "Nominee Access";
        description = "Enter the user ID and nominee code to continue.";
        form = renderNomineeLoginView();
        break;
      case "otp":
        title = "Check your Email";
        description = `We sent a 6-digit code to ${email}.`;
        form = renderOtpView();
        break;
      case "face-stepup":
        title = "Step-Up Verification";
        description = "Complete face verification to finish signing in.";
        form = renderFaceStepUpView();
        break;
      case "main":
      default:
        title = "Welcome to Sagenex";
        description = "Choose how you'd like to sign in.";
        form = renderMainView();
    }

    const showBlockedNotice = isAccountBlocked && error;

    return (
        <>
            <CardHeader className="text-center space-y-4">
                <Image src="/logo5.png" alt="Sagenex Logo" width={60} height={60} className="mx-auto rounded-full" />
                <div className="space-y-1">
                    <CardTitle className="text-2xl font-bold tracking-tight text-[#0a0a0a]">{title}</CardTitle>
                    <CardDescription className="text-zinc-500">{description}</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {showBlockedNotice && (
                  <div className="rounded-xl border border-[#C41E3A]/20 bg-[#C41E3A08] p-4 text-left">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-[#C41E3A15] p-2 text-[#C41E3A]">
                        <ShieldAlert className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-[#0a0a0a]">Account blocked by admin</p>
                        <p className="text-sm text-zinc-600">
                          This account is currently blocked. You cannot continue login until admin access is restored.
                        </p>
                        <p className="text-xs text-zinc-400">
                          Please contact support or your admin team for the unblock status.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {form}
                {(view === "identify" || view === "main") && (
                    <Button
                      variant="outline"
                      className="w-full flex items-center gap-2 border-[#e8e8e8] text-zinc-700 hover:bg-[#f5f5f5] rounded-xl"
                      onClick={() => changeView("nominee-login")}
                      disabled={isLoading}
                    >
                      <User className="h-4 w-4" /> Nominee Access
                    </Button>
                )}
                {(view !== 'identify' && view !== "face-stepup") && (
                    <p className="text-center text-sm text-zinc-500">
                        <Button variant="link" className="p-0 flex items-center gap-2 text-[#C41E3A] hover:text-[#a81831]" onClick={handleBack} disabled={isLoading}>
                            <ArrowLeft className="h-4 w-4" /> Back
                        </Button>
                    </p>
                )}
                {(view === 'identify' || view === 'main') && (
                    <p className="text-center text-sm text-zinc-500">
                        No account?{" "}
                        <Button variant="link" className="p-0 text-[#C41E3A] hover:text-[#a81831]" onClick={() => changeView("email-signup")} disabled={isLoading}>
                        Sign up
                        </Button>
                    </p>
                )}
                {error && !showBlockedNotice && <p className="text-red-500 text-sm text-center pt-2">{error}</p>}
                {message && <p className="text-green-500 text-sm text-center pt-2">{message}</p>}
            </CardContent>
        </>
    )
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel — crimson, desktop only */}
      <div className="hidden md:flex w-1/2 flex-col items-center justify-center bg-[#C41E3A] px-12 text-white">
        <Image
          src="/sagenex.png"
          alt="Sagenex emblem"
          width={200}
          height={200}
          className="mb-8 h-auto w-[200px]"
          style={{ filter: "drop-shadow(0 0 40px rgba(255,255,255,0.3))" }}
        />
        <p className="mb-4 text-center text-2xl font-bold leading-snug">
          A Civilization of<br />Heritage &amp; Innovation
        </p>
        <p className="text-center text-sm text-white/70">
          KYC Compliant · AI-Powered · Structured Returns
        </p>
      </div>

      {/* Right panel — white */}
      <div className="flex w-full flex-col items-center justify-center bg-white px-6 py-12 md:w-1/2">
        <div className="w-full max-w-md">
          <Card className="border-[#e8e8e8] bg-white shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
            {renderView()}
          </Card>
        </div>
      </div>
    </div>
  );
};

const LoginPage = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <Login />
  </Suspense>
);

export default LoginPage;
