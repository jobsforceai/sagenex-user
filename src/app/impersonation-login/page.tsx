"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldAlert, Loader2 } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

function ImpersonationLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { bootstrapImpersonationSession } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const bootstrapped = useRef(false);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    const token = searchParams.get("token");
    if (!token) {
      setError("Missing impersonation token.");
      return;
    }

    const userId = searchParams.get("userId");
    const fullName = searchParams.get("fullName");
    const email = searchParams.get("email");
    const userData = userId && fullName && email ? { userId, fullName, email } : undefined;

    const bootstrap = async () => {
      const result = await bootstrapImpersonationSession(token, userData);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.replace("/dashboard");
    };

    bootstrap();
  }, [bootstrapImpersonationSession, router, searchParams]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-black border-gray-800 shadow-2xl shadow-blue-500/10">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300">
            {error ? <ShieldAlert className="h-6 w-6" /> : <Loader2 className="h-6 w-6 animate-spin" />}
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight">
              {error ? "Impersonation login failed" : "Starting impersonation session"}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {error
                ? "The session could not be started with the provided token."
                : "Please wait while we load the impersonated account."}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {error && <p className="text-sm text-center text-red-400">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ImpersonationLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <ImpersonationLoginContent />
    </Suspense>
  );
}
