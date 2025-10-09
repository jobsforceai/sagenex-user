"use client";

import React from "react";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { useAuth } from "@/app/context/AuthContext";

const LoginPage = () => {
  const { login } = useAuth();
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

  const handleGoogleLogin = async (
    credentialResponse: CredentialResponse
  ) => {
    try {
      const idToken = credentialResponse.credential;
      const res = await fetch(`${backendUrl}/api/v1/auth/google/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });

      if (res.ok) {
        const data = await res.json();
        login(data.token); // The login function handles redirect
      } else {
        console.error("Google login failed:", await res.text());
        // Handle login failure, e.g., show an error message
      }
    } catch (error) {
      console.error("An error occurred during Google login:", error);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <div>
        <h1>Login</h1>
        <p>Please sign in to continue.</p>
        <GoogleLogin
          onSuccess={handleGoogleLogin}
          onError={() => {
            console.error("Login Failed");
            // Handle login failure
          }}
        />
      </div>
    </div>
  );
};

export default LoginPage;
