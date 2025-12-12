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
import { registerUser, loginOtp, verifyEmail, login } from "@/actions/auth";
import { Mail, User, Phone, KeyRound, ArrowLeft, LogIn, UserPlus, ShieldCheck, Loader2 } from "lucide-react";
import Image from "next/image";

type View = "main" | "email-login" | "email-signup" | "otp" | "password-login";

function Login() {
  const { login: authLogin } = useAuth();
  const searchParams = useSearchParams();
  
  const [view, setView] = useState<View>("main");
  const [previousView, setPreviousView] = useState<View>("main");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form fields
  const [sponsorId, setSponsorId] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setSponsorId(ref);
    }
  }, [searchParams]);

  const changeView = (newView: View) => {
    setPreviousView(view);
    setView(newView);
  }

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
        setError("Password must be at least 8 characters long.");
        return;
    }

    setIsLoading(true);

    if (!fullName || !email) {
        setError("Full name and email are required.");
        setIsLoading(false);
        return;
    }

    try {
        const data = await registerUser(fullName, email, phone, sponsorId, password);
        if (data.error) {
            setError(data.error);
        } else {
            setMessage(data.message || "Registration successful. Please check your email for OTP.");
            changeView("otp");
        }
    } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleEmailLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    if (!email) {
        setError("Email is required.");
        setIsLoading(false);
        return;
    }

    try {
        const data = await loginOtp(email);
        if (data.error) {
            setError(data.error);
        } else {
            setMessage(data.message || "Login OTP has been sent to your email.");
            changeView("otp");
        }
    } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
        setIsLoading(false);
    }
  };

  const handlePasswordLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!email || !password) {
      setError("Email and password are required.");
      setIsLoading(false);
      return;
    }

    try {
      const data = await login(email, password);
      if (data.error) {
        setError(data.error);
      } else {
        authLogin(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!otp || !email) {
        setError("Email and OTP are required.");
        setIsLoading(false);
        return;
    }

    try {
        const data = await verifyEmail(email, otp);
        if (data.error) {
            setError(data.error);
        } else {
            authLogin(data);
        }
    } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
        setIsLoading(false);
    }
  };

  const renderMainView = () => (
    <div className="space-y-3">
      <Button onClick={() => changeView("password-login")} className="w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
        <KeyRound className="h-4 w-4" /> Continue with Password
      </Button>
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
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-black border-gray-800 text-white pl-10"
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
          className="bg-black border-gray-800 text-white pl-10"
          disabled={isLoading}
        />
      </div>
      <Button type="submit" className="w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Login <LogIn className="h-4 w-4" /></>}
      </Button>
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
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-black border-gray-800 text-white pl-10"
          disabled={isLoading}
        />
      </div>
      <Button type="submit" className="w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Send OTP <LogIn className="h-4 w-4" /></>}
      </Button>
    </form>
  );

  const renderEmailSignUpView = () => (
    <form onSubmit={handleSignUpSubmit} className="space-y-4">
        <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Full Name" id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="bg-black border-gray-800 text-white pl-10" disabled={isLoading} />
        </div>
        <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Email" id="email-signup" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-black border-gray-800 text-white pl-10" disabled={isLoading} />
        </div>
        <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Password" id="password-signup" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-black border-gray-800 text-white pl-10" disabled={isLoading} />
        </div>
        <div className="relative">
            <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Confirm Password" id="confirmPassword-signup" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="bg-black border-gray-800 text-white pl-10" disabled={isLoading} />
        </div>
        <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Phone (Optional)" id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-black border-gray-800 text-white pl-10" disabled={isLoading} />
        </div>
        <div className="relative">
            <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Referral Code (Optional)" id="sponsorId-signup" value={sponsorId} onChange={(e) => setSponsorId(e.target.value)} className="bg-black border-gray-800 text-white pl-10" disabled={isLoading} />
        </div>
        <Button type="submit" className="w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Create Account <UserPlus className="h-4 w-4" /></>}
        </Button>
    </form>
  );

  const renderOtpView = () => (
    <form onSubmit={handleOtpSubmit} className="space-y-4">
        <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="6-Digit OTP" id="otp" type="text" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} required className="bg-black border-gray-800 text-white text-center tracking-[0.5em] pl-10" disabled={isLoading} />
        </div>
        <Button type="submit" className="w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Verify <ShieldCheck className="h-4 w-4" /></>}
        </Button>
    </form>
  );

  const renderView = () => {
    let title, description, form;
    switch (view) {
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
      case "otp":
        title = "Check your Email";
        description = `We sent a 6-digit code to ${email}.`;
        form = renderOtpView();
        break;
      case "main":
      default:
        title = "Welcome to Sagenex";
        description = "Sign in or create an account to continue";
        form = renderMainView();
    }

    return (
        <>
            <CardHeader className="text-center space-y-4">
                <Image src="/logo5.png" alt="Sagenex Logo" width={60} height={60} className="mx-auto rounded-full" />
                <div className="space-y-1">
                    <CardTitle className="text-2xl font-bold tracking-tight">{title}</CardTitle>
                    <CardDescription className="text-gray-400">{description}</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {form}
                {(view !== 'main') && (
                    <p className="text-center text-sm text-gray-400">
                        <Button variant="link" className="p-0 flex items-center gap-2" onClick={() => changeView(view === 'otp' ? previousView : 'main')} disabled={isLoading}>
                            <ArrowLeft className="h-4 w-4" /> Back
                        </Button>
                    </p>
                )}
                {view === 'main' && (
                    <p className="text-center text-sm text-gray-400">
                        No account?{" "}
                        <Button variant="link" className="p-0" onClick={() => changeView("email-signup")} disabled={isLoading}>
                        Sign up
                        </Button>
                    </p>
                )}
                {error && <p className="text-red-500 text-sm text-center pt-2">{error}</p>}
                {message && <p className="text-green-500 text-sm text-center pt-2">{message}</p>}
            </CardContent>
        </>
    )
  };

  return (
    <div className="bg-black text-white min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-black border-gray-800 shadow-2xl shadow-blue-500/10">
        {renderView()}
      </Card>
    </div>
  );
};

const LoginPage = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <Login />
  </Suspense>
);

export default LoginPage;
