"use client";

import React, { useState } from "react";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { useAuth } from "@/app/context/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const LoginPage = () => {
  const { login } = useAuth();
  const [sponsorId, setSponsorId] = useState("");
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

  const handleGoogleSuccess = async (
    credentialResponse: CredentialResponse
  ) => {
    const idToken = credentialResponse.credential;
    if (!idToken) {
      setError("Google sign-in failed. Please try again.");
      return;
    }

    try {
      // Step 1: Check if user exists
      const checkUserRes = await fetch(`${backendUrl}/api/v1/auth/google/check-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!checkUserRes.ok) {
        throw new Error("Failed to verify user status.");
      }

      const { exists } = await checkUserRes.json();

      if (exists) {
        // Scenario A: User exists, log them in directly
        await finalLogin(idToken);
      } else {
        // Scenario B: New user, show referral input
        setGoogleToken(idToken);
        setIsNewUser(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
      console.error(err);
    }
  };

  const finalLogin = async (idToken: string, sponsor?: string) => {
    try {
      const body: { idToken: string; sponsorId?: string } = { idToken };
      if (sponsor) {
        body.sponsorId = sponsor;
      }

      const res = await fetch(`${backendUrl}/api/v1/auth/google/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        login(data.token); // The login function handles redirect
      } else {
        const errorText = await res.text();
        setError(`Login failed: ${errorText}`);
        console.error("Google login failed:", errorText);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
      console.error("An error occurred during Google login:", err);
    }
  };

  const handleNewUserSubmit = () => {
    if (googleToken) {
      finalLogin(googleToken, sponsorId);
    }
  };

  return (
    <div className="bg-black text-white min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-800">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to Sagenex</CardTitle>
          <CardDescription>
            {isNewUser
              ? "Complete your sign-up."
              : "Sign in to access your dashboard."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isNewUser ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sponsorId">Referral Code (Optional)</Label>
                <Input
                  id="sponsorId"
                  placeholder="Enter your sponsor's code"
                  value={sponsorId}
                  onChange={(e) => setSponsorId(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <Button onClick={handleNewUserSubmit} className="w-full">
                Complete Sign-Up
              </Button>
            </div>
          ) : (
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  setError("Google login failed. Please try again.");
                  console.error("Login Failed");
                }}
              />
            </div>
          )}
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
