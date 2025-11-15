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

export async function updateUserProfile(data: { fullName?: string; phone?: string; usdtTrc20Address?: string }) {
    const res = await fetch(`${API_BASE_URL}/api/v1/user/profile`, {
        method: "PATCH",
        headers: await getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return handleApiResponse(res);
}

export async function getPayouts(page: number = 1, limit: number = 20) {
    const res = await fetch(`${API_BASE_URL}/api/v1/user/payouts?page=${page}&limit=${limit}`, {
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

export async function getWalletData() {
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

export async function getPlacementOptions() {
    const res = await fetch(`${API_BASE_URL}/api/v1/user/team/placement-options`, {
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

export async function executeTransfer(recipientId: string, amount: number, otp: string, transferType?: 'TO_AVAILABLE_BALANCE' | 'TO_PACKAGE') {
    const body: { recipientId: string; amount: number; otp: string; transferType?: string } = {
        recipientId,
        amount,
        otp,
    };

    if (transferType) {
        body.transferType = transferType;
    }

    const res = await fetch(`${API_BASE_URL}/api/v1/wallet/transfer/execute`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify(body),
    });
    return handleApiResponse(res);
}

export async function createCryptoDepositInvoice(amount: number) {
    const res = await fetch(`${API_BASE_URL}/api/v1/wallet/deposits/crypto`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ amount }),
      });
      return handleApiResponse(res);
}

export async function requestWithdrawal(data: { 
    amount: number; 
    withdrawalAddress?: string; 
    upiId?: string,
    bankDetails?: {
        bankName: string;
        accountNumber: string;
        ifscCode: string;
        holderName: string;
    }
}) {
    const res = await fetch(`${API_BASE_URL}/api/v1/wallet/request-withdrawal`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return handleApiResponse(res);
}

export async function getRewards() {
    const res = await fetch(`${API_BASE_URL}/api/v1/rewards`, {
        headers: await getAuthHeaders(),
      });
      return handleApiResponse(res);
}

export async function claimReward(rewardId: string) {
    const res = await fetch(`${API_BASE_URL}/api/v1/rewards/${rewardId}/claim`, {
        method: "POST",
        headers: await getAuthHeaders(),
      });
      return handleApiResponse(res);
}

export async function transferReward(rewardId: string, recipientId: string) {
    const res = await fetch(`${API_BASE_URL}/api/v1/rewards/${rewardId}/transfer`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ recipientId }),
      });
      return handleApiResponse(res);
}

export async function uploadRewardDocument(rewardId: string, formData: FormData) {
    const res = await fetch(`${API_BASE_URL}/api/v1/rewards/${rewardId}/documents/upload`, {
        method: "POST",
        headers: await getAuthHeaders(false),
        body: formData,
      });
      return handleApiResponse(res);
}

export async function submitRewardDocuments(rewardId: string) {
    const res = await fetch(`${API_BASE_URL}/api/v1/rewards/${rewardId}/documents/submit`, {
        method: "POST",
        headers: await getAuthHeaders(),
      });
      return handleApiResponse(res);
}

export async function getAllCourses() {
    const res = await fetch(`${API_BASE_URL}/api/v1/courses`, {
        headers: await getAuthHeaders(),
      });
      return handleApiResponse(res);
}

export async function getCourseById(courseId: string) {
    const res = await fetch(`${API_BASE_URL}/api/v1/courses/${courseId}`, {
        headers: await getAuthHeaders(),
      });
      return handleApiResponse(res);
}

export async function enrollInCourse(courseId: string) {
    const res = await fetch(`${API_BASE_URL}/api/v1/courses/${courseId}/enroll`, {
        method: "POST",
        headers: await getAuthHeaders(),
      });
      return handleApiResponse(res);
}

export async function getCourseProgress(courseId: string) {
    const res = await fetch(`${API_BASE_URL}/api/v1/courses/${courseId}/progress`, {
        headers: await getAuthHeaders(),
      });
      return handleApiResponse(res);
}

export async function updateVideoProgress(courseId: string, lessonId: string, watchedSeconds: number) {
    const res = await fetch(`${API_BASE_URL}/api/v1/courses/${courseId}/lessons/${lessonId}/progress`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ watchedSeconds }),
      });
      return handleApiResponse(res);
}

export async function markLessonAsComplete(courseId: string, lessonId: string) {
    const res = await fetch(`${API_BASE_URL}/api/v1/courses/${courseId}/lessons/${lessonId}/complete`, {
        method: "POST",
        headers: await getAuthHeaders(),
      });
      return handleApiResponse(res);
}

export async function getCurrentPayoutProgress() {
    const res = await fetch(`${API_BASE_URL}/api/v1/user/payouts/current`, {
        headers: await getAuthHeaders(),
      });
      return handleApiResponse(res);
}
