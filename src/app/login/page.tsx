"use client";

import React, { useState, useEffect, Suspense } from "react";
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
import { getSafeRedirectPath } from "@/lib/auth-routes";
import { Mail, User, Phone, KeyRound, ArrowLeft, LogIn, UserPlus, ShieldCheck, Loader2, ShieldAlert } from "lucide-react";
import Image from "next/image";

type View = "identify" | "main" | "email-login" | "email-signup" | "otp" | "password-login" | "nominee-login";

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

  const [view, setView] = useState<View>("identify");
  const [previousView, setPreviousView] = useState<View>("identify");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [hasPasswordSet, setHasPasswordSet] = useState<boolean | null>(null);
  const [passwordStatusEmail, setPasswordStatusEmail] = useState<string | null>(null);
  const [isVerifyFlow, setIsVerifyFlow] = useState(false);
  const [isAccountBlocked, setIsAccountBlocked] = useState(false);

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
  };

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

  const handleAuthSuccess = async (data: AuthResponse) => {
    const resolvedData = await resolvePasswordStatus(data);
    const nextPath = getSafeRedirectPath(searchParams.get("next"));
    authLogin(resolvedData, nextPath);
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
  );

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
          {view !== "identify" && (
            <p className="text-center text-sm text-zinc-500">
              <Button variant="link" className="p-0 flex items-center gap-2 text-[#C41E3A] hover:text-[#a81831]" onClick={handleBack} disabled={isLoading}>
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            </p>
          )}
          {(view === "identify" || view === "main") && (
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
    );
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
}

const LoginPage = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <Login />
  </Suspense>
);

export default LoginPage;
