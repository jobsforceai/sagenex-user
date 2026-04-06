"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

async function getAuthHeaders() {
    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value;
    if (!token) {
      redirect("/login");
    }
    const headers: HeadersInit = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
    return headers;
  }

  async function handleApiResponse(response: Response) {
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

    if (
      response.status === 403 &&
      responseData?.message === "Email not verified. Please verify your email to continue."
    ) {
      const cookieStore = await cookies();
      cookieStore.delete("authToken");
      redirect("/login?verify=1");
    }

    if (response.status === 401) {
      console.error("API request returned 401 Unauthorized.");
      redirect("/login");
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

// --- SGNX Gold ---

export async function getMyEnrollments() {
    const res = await fetch(`${API_BASE_URL}/api/v1/sgnxgold/my-enrollments`, {
        headers: await getAuthHeaders(),
    });
    return handleApiResponse(res);
}

export async function getEnrollmentDetail(enrollmentId: string) {
    const res = await fetch(`${API_BASE_URL}/api/v1/sgnxgold/enrollment/${enrollmentId}`, {
        headers: await getAuthHeaders(),
    });
    return handleApiResponse(res);
}

export async function enrollFromWallet(body: { userId: string; amountUsd: number; planType: "gold" | "cash" }) {
    const res = await fetch(`${API_BASE_URL}/api/v1/sgnxgold/enroll-from-wallet`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify(body),
    });
    return handleApiResponse(res);
}

export async function getLiveGoldRate() {
    const res = await fetch(`${API_BASE_URL}/api/v1/sgnxgold/gold-rate`, {
        headers: await getAuthHeaders(),
    });
    return handleApiResponse(res);
}
