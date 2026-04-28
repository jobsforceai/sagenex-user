"use client";

import React, { useState } from "react";
import { setPassword } from "@/actions/user";
import { passwordStatus } from "@/actions/auth";
import { useAuth } from "@/app/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ShieldCheck, Eye, EyeOff } from "lucide-react";
import PasswordStrength from "./PasswordStrength";

interface SetPasswordModalProps {
  onPasswordSet: () => void;
}

export default function SetPasswordModal({ onPasswordSet }: SetPasswordModalProps) {
  const { user } = useAuth();
  const [password, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters long."); return; }
    setIsLoading(true);
    try {
      const data = await setPassword(password, confirmPassword);
      if (data.error) setError(data.error);
      else { setMessage(data.message || "Password set successfully!"); setTimeout(onPasswordSet, 2000); }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally { setIsLoading(false); }
  };

  const handleSkip = async () => {
    setError(null); setMessage(null); setIsCheckingStatus(true);
    try {
      if (user?.hasPasswordSet) { onPasswordSet(); return; }
      if (!user?.email) { setError("We could not verify your email. Please set a password."); return; }
      const status = await passwordStatus(user.email);
      if (status?.error) { setError(status.error); return; }
      if (status?.hasPasswordSet) { onPasswordSet(); return; }
      setError("Your password is not set yet. Please create one to continue.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally { setIsCheckingStatus(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_25px_80px_rgba(15,23,42,0.18)] sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF1F4]">
            <ShieldCheck className="h-6 w-6 text-[#C81E4A]" />
          </span>
          <h2 className="text-2xl font-black tracking-tight text-[#0F172A]">Create Your Password</h2>
          <p className="mt-2 text-sm text-[#64748B]">
            To secure your account, please create a password. You can use this to log in next time.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="New Password"
              value={password}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={isLoading}
              className="h-11 rounded-xl border-slate-200 bg-white pr-10 text-[#0F172A] placeholder:text-slate-400 focus-visible:ring-[#C81E4A]/30"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-[#0F172A]">
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {password && <PasswordStrength password={password} />}
          <div className="relative">
            <Input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
              className="h-11 rounded-xl border-slate-200 bg-white pr-10 text-[#0F172A] placeholder:text-slate-400 focus-visible:ring-[#C81E4A]/30"
            />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-[#0F172A]">
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {confirmPassword && password !== confirmPassword && (
            <p className="text-sm font-semibold text-rose-600">Passwords do not match.</p>
          )}
          {confirmPassword && password === confirmPassword && (
            <p className="text-sm font-semibold text-emerald-600">Passwords match.</p>
          )}
          <Button type="submit" disabled={isLoading} className="h-11 w-full rounded-xl bg-[#C81E4A] font-bold text-white shadow-[0_10px_30px_rgba(200,30,74,0.25)] hover:bg-[#A90D32]">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (<>Set Password <ShieldCheck className="ml-2 h-4 w-4" /></>)}
          </Button>
        </form>

        <div className="mt-6 space-y-2 text-center">
          <p className="text-xs text-[#64748B]">Already created a password for this account? You can skip this step.</p>
          <Button
            type="button"
            variant="outline"
            disabled={isLoading || isCheckingStatus}
            onClick={handleSkip}
            className="h-10 w-full rounded-xl border-slate-200 bg-white font-bold text-[#0F172A] hover:bg-slate-50"
          >
            {isCheckingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : "Skip password setup"}
          </Button>
        </div>

        {error && <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-center text-sm font-semibold text-rose-700">{error}</p>}
        {message && <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-center text-sm font-semibold text-emerald-700">{message}</p>}
      </div>
    </div>
  );
}
