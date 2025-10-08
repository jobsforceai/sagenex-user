"use client";

import React from "react";

const LoginPage = () => {
  // This should be configured in your .env.local file
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

  const googleLoginUrl = `${backendUrl}/api/v1/auth/google`;

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
        <a
          href={googleLoginUrl}
          style={{
            display: "inline-block",
            padding: "10px 20px",
            backgroundColor: "#4285F4",
            color: "white",
            textDecoration: "none",
            borderRadius: "5px",
            fontWeight: "bold",
          }}
        >
          Sign in with Google
        </a>
      </div>
    </div>
  );
};

export default LoginPage;
