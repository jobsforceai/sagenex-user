"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

async function getAuthHeaders(isJson = true) {
    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value;
    if (!token) {
      redirect("/login");
    }
    const headers: HeadersInit = {
      Authorization: `Bearer ${token}`,
    };
    if (isJson) {
      headers["Content-Type"] = "application/json";
    }
    return headers;
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

export async function updateUserProfile(data: { fullName?: string; phone?: string }) {
    const res = await fetch(`${API_BASE_URL}/api/v1/user/profile`, {
        method: "PATCH",
        headers: await getAuthHeaders(),
        body: JSON.stringify(data),
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

export async function uploadKycDocument(formData: FormData) {
    const res = await fetch(`${API_BASE_URL}/api/v1/kyc/document`, {
        method: "POST",
        headers: await getAuthHeaders(false),
        body: formData,
      });
      return handleApiResponse(res);
}

export async function submitKycForReview() {
    const res = await fetch(`${API_BASE_URL}/api/v1/kyc/submit-for-review`, {
        method: "POST",
        headers: await getAuthHeaders(),
      });
      return handleApiResponse(res);
}

export async function getKycStatus() {
    const res = await fetch(`${API_BASE_URL}/api/v1/kyc/status`, {
        headers: await getAuthHeaders(),
      });
      return handleApiResponse(res);
}

export async function getPlacementQueue() {
    const res = await fetch(`${API_BASE_URL}/api/v1/user/team/placement-queue`, {
        headers: await getAuthHeaders(),
      });
      return handleApiResponse(res);
}

export async function placeUser(newUserId: string, placementParentId: string) {
    const res = await fetch(`${API_BASE_URL}/api/v1/user/team/place-user`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ newUserId, placementParentId }),
      });
      return handleApiResponse(res);
}

export async function transferUser(userIdToTransfer: string, newSponsorId: string) {
    const res = await fetch(`${API_BASE_URL}/api/v1/user/team/transfer-user`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ userIdToTransfer, newSponsorId }),
      });
      return handleApiResponse(res);
}

export async function getTransferRecipients() {
    const res = await fetch(`${API_BASE_URL}/api/v1/user/transfer-recipients`, {
        headers: await getAuthHeaders(),
      });
      return handleApiResponse(res);
}

export async function sendTransferOtp() {
    const res = await fetch(`${API_BASE_URL}/api/v1/wallet/transfer/send-otp`, {
        method: "POST",
        headers: await getAuthHeaders(),
      });
      return handleApiResponse(res);
}

export async function executeTransfer(recipientId: string, amount: number, otp: string) {
    const res = await fetch(`${API_BASE_URL}/api/v1/wallet/transfer/execute`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ recipientId, amount, otp }),
      });
      return handleApiResponse(res);
}
