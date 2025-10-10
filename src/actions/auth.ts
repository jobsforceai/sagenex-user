"use server";

import { redirect } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";



async function handleApiResponse(response: Response) {
  if (response.status === 401) {
    console.error("API request returned 401 Unauthorized.");
    redirect("/login");
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
    const checkUserRes = await fetch(`${API_BASE_URL}/api/v1/auth/google/check-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!checkUserRes.ok) {
        throw new Error("Failed to verify user status.");
      }

      return await checkUserRes.json();
}

export async function finalLogin(idToken: string, sponsor?: string) {
    const body: { idToken: string; sponsorId?: string } = { idToken };
    if (sponsor) {
      body.sponsorId = sponsor;
    }

    const res = await fetch(`${API_BASE_URL}/api/v1/auth/google/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    return handleApiResponse(res);
}
