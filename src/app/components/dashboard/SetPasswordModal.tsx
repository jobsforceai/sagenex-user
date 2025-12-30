"use client";

import React, { useState } from "react";
import { setPassword } from "@/actions/user";
import { passwordStatus } from "@/actions/auth";
import { useAuth } from "@/app/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
        setError("Password must be at least 8 characters long.");
        return;
    }

    setIsLoading(true);

    try {
      const data = await setPassword(password, confirmPassword);
      if (data.error) {
        setError(data.error);
      } else {
        setMessage(data.message || "Password set successfully!");
        setTimeout(() => {
            onPasswordSet();
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    setError(null);
    setMessage(null);
    setIsCheckingStatus(true);

    try {
      if (user?.hasPasswordSet) {
        onPasswordSet();
        return;
      }

      if (!user?.email) {
        setError("We could not verify your email. Please set a password.");
        return;
      }

      const status = await passwordStatus(user.email);
      if (status?.error) {
        setError(status.error);
        return;
      }

      if (status?.hasPasswordSet) {
        onPasswordSet();
        return;
      }

      setError("Your password is not set yet. Please create one to continue.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsCheckingStatus(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <Card className="w-full max-w-md bg-gray-900 border-gray-800 text-white">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Create Your Password</CardTitle>
          <CardDescription>
            To secure your account, please create a password. You can use this to log in next time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="New Password"
                value={password}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="bg-black border-gray-700 pr-10"
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400"
                onClick={() => setShowPassword(!showPassword)}
              >
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
                className="bg-black border-gray-700 pr-10"
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
                <p className="text-red-500 text-sm">Passwords do not match.</p>
            )}
            {confirmPassword && password === confirmPassword && (
                <p className="text-green-500 text-sm">Passwords match.</p>
            )}
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Set Password <ShieldCheck className="h-4 w-4 ml-2" /></>}
            </Button>
          </form>
          <div className="mt-6 space-y-2 text-center">
            <p className="text-xs text-gray-400">
              Already created a password for this account? You can skip this step.
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-full border-gray-700 text-gray-200 hover:bg-gray-800"
              onClick={handleSkip}
              disabled={isLoading || isCheckingStatus}
            >
              {isCheckingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : "Skip password setup"}
            </Button>
          </div>
          {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}
          {message && <p className="text-green-500 text-sm text-center mt-4">{message}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
