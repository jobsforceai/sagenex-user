"use server";

import { redirect } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

async function handleApiResponse(response: Response) {
  if (response.status === 401) {
    console.error("API request returned 401 Unauthorized.");
    // Avoid redirecting here for auth flows, let the client handle it
  }

  const responseText = await response.text();
  let responseData;

  try {
    responseData = JSON.parse(responseText);
  } catch {
    console.error(
      `API Error: Failed to parse response as JSON. Status: ${
        response.status
      }. Response: ${responseText.substring(0, 500)}...`
    );
    return { error: "The server returned an invalid response." };
  }

  if (!response.ok) {
    console.error(
      `API Error: Status: ${response.status}. Response: ${JSON.stringify(
        responseData
      )}`
    );
    return {
      error: responseData.message || `Request failed with status ${response.status}`,
    };
  }

  return responseData;
}

export async function checkUser(idToken: string) {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/user/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      return handleApiResponse(res);
}

export async function googleLogin(idToken: string, sponsor?: string) {
    const body: { idToken: string; sponsorId?: string } = { idToken };
    if (sponsor) {
      body.sponsorId = sponsor;
    }

    const res = await fetch(`${API_BASE_URL}/api/v1/auth/user/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    return handleApiResponse(res);
}

export async function registerUser(fullName: string, email: string, phone?: string, sponsorId?: string) {
  const body: { fullName: string; email: string; phone?: string; sponsorId?: string } = { fullName, email };
  if (phone) body.phone = phone;
  if (sponsorId) body.sponsorId = sponsorId;

  const res = await fetch(`${API_BASE_URL}/api/v1/auth/user/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return handleApiResponse(res);
}

export async function loginOtp(email: string) {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/user/login-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  return handleApiResponse(res);
}

export async function verifyEmail(email: string, otp: string) {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/user/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });

  return handleApiResponse(res);
}