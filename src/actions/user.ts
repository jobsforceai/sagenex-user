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
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

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

export async function getDashboardData() {
    const res = await fetch(`${API_BASE_URL}/api/v1/user/dashboard`, {
        headers: await getAuthHeaders(),
      });
      return handleApiResponse(res);
}

export async function getProfileData() {
    const res = await fetch(`${API_BASE_URL}/api/v1/user/profile`, {
        headers: await getAuthHeaders(),
      });
      return handleApiResponse(res);
}

export async function getPayouts() {
    const res = await fetch(`${API_BASE_URL}/api/v1/user/payouts`, {
        headers: await getAuthHeaders(),
      });
      return handleApiResponse(res);
}

export async function getTeamTree() {
    const res = await fetch(
        `${API_BASE_URL}/api/v1/user/team/tree`,
        {
          headers: await getAuthHeaders(),
        }
      );
      return handleApiResponse(res);
}

export async function getWalletTransactions() {
    const res = await fetch(`${API_BASE_URL}/api/v1/user/wallet`, {
        headers: await getAuthHeaders(),
      });
      return handleApiResponse(res);
}

export async function getReferralSummary() {
  const res = await fetch(`${API_BASE_URL}/api/v1/user/team/summary`, {
    headers: await getAuthHeaders(),
  });
  return handleApiResponse(res);
}

export async function getRankProgress() {
  const res = await fetch(`${API_BASE_URL}/api/v1/user/rank-progress`, {
    headers: await getAuthHeaders(),
  });
  return handleApiResponse(res);
}

export async function getLeaderboard() {
  const res = await fetch(`${API_BASE_URL}/api/v1/user/leaderboard`, {
    headers: await getAuthHeaders(),
  });
  return handleApiResponse(res);
}

export async function getFinancialSummary() {
  const res = await fetch(`${API_BASE_URL}/api/v1/user/financial-summary`, {
    headers: await getAuthHeaders(),
  });
  return handleApiResponse(res);
}
