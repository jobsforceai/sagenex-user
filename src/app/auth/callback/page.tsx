"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

const AuthCallbackPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");

    // IMPORTANT: Your backend must redirect to this page with the token in the query params.
    // e.g., res.redirect('http://localhost:3000/auth/callback?token=YOUR_JWT_TOKEN');

    if (token) {
      login(token);
      // The login function in AuthContext will redirect to '/'
    } else {
      // Handle the case where the token is not present
      console.error("No token found in URL");
      router.push("/login");
    }
  }, [searchParams, login, router]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <p>Authenticating, please wait...</p>
    </div>
  );
};

export default AuthCallbackPage;
