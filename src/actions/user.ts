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

export async function getDashboardData() {
    const headers = await getAuthHeaders();
    const [dashboardRes, rankRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/user/dashboard`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/user/rank-progress`, { headers })
    ]);

    const dashboardData = await handleApiResponse(dashboardRes);
    const rankData = await handleApiResponse(rankRes);

    if (dashboardData.error || rankData.error) {
        return { error: dashboardData.error || rankData.error };
    }

    return { ...dashboardData, rank: rankData.rank, performanceRank: rankData.performanceRank };
}

export async function setPassword(password: string, confirmPassword: string) {
  const res = await fetch(`${API_BASE_URL}/api/v1/user/profile/set-password`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ password, confirmPassword }),
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

export async function getBonusRulesConfig() {
    const res = await fetch(`${API_BASE_URL}/api/v1/config/bonus-rules`, {
        headers: await getAuthHeaders(),
    });
    return handleApiResponse(res);
}

export async function getWalletData() {
    const res = await fetch(`${API_BASE_URL}/api/v1/user/wallet`, {
        headers: await getAuthHeaders(),
    });
    return handleApiResponse(res);
}

export async function clearUserCache() {
    const res = await fetch(`${API_BASE_URL}/api/v1/user/cache/clear`, {
        method: "POST",
        headers: await getAuthHeaders(),
    });
    return handleApiResponse(res);
}

export async function getBiometricsStatus() {
    const res = await fetch(`${API_BASE_URL}/api/v1/user/biometrics/status`, {
        headers: await getAuthHeaders(),
    });
    return handleApiResponse(res);
}

export async function enrollFaceEmbedding(payload: {
    embedding: number[];
    source: string;
    faceImageUrl?: string;
    meta?: Record<string, unknown>;
}) {
    const res = await fetch(`${API_BASE_URL}/api/v1/user/biometrics/enroll`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify(payload),
    });
    return handleApiResponse(res);
}

export async function verifyFaceEmbedding(payload: {
    embedding: number[];
    purpose: string;
    livenessScore: number;
    meta?: Record<string, unknown>;
}) {
    const res = await fetch(`${API_BASE_URL}/api/v1/user/biometrics/verify`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify(payload),
    });
    return handleApiResponse(res);
}

export async function getNomineeStatus() {
    const res = await fetch(`${API_BASE_URL}/api/v1/user/nominee`, {
        headers: await getAuthHeaders(),
    });
    return handleApiResponse(res);
}

export async function setNomineePhrase(phrase: string) {
    const res = await fetch(`${API_BASE_URL}/api/v1/user/nominee`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ phrase }),
    });
    return handleApiResponse(res);
}

export async function disableNomineeAccess() {
    const res = await fetch(`${API_BASE_URL}/api/v1/user/nominee`, {
        method: "DELETE",
        headers: await getAuthHeaders(),
    });
    return handleApiResponse(res);
}

export async function getWalletCurrentCycleHistory(params?: {
    includeCycles?: boolean;
    cyclesLimit?: number;
    cycleId?: string;
}) {
    const searchParams = new URLSearchParams();
    if (params?.includeCycles) {
        searchParams.set("includeCycles", "1");
    }
    if (params?.cyclesLimit) {
        searchParams.set("cyclesLimit", String(params.cyclesLimit));
    }
    if (params?.cycleId) {
        searchParams.set("cycleId", params.cycleId);
    }
    const query = searchParams.toString();
    const res = await fetch(
        `${API_BASE_URL}/api/v1/wallet/current-cycle-history${query ? `?${query}` : ""}`,
        {
            headers: await getAuthHeaders(),
        }
    );
    return handleApiResponse(res);
}

export async function getReferralSummary() {
  const res = await fetch(`${API_BASE_URL}/api/v1/user/team/summary`, {
    headers: await getAuthHeaders(),
  });
  return handleApiResponse(res);
}

export async function createSgbnCoupon(planType: "BUSINESS" | "FREELANCER") {
  const res = await fetch(`${API_BASE_URL}/api/v1/wallet/sgbn/coupons`, {
    method: "POST",
    headers: await getAuthHeaders(),
    body: JSON.stringify({
      targetPlatform: "SGBN",
      planType,
      sourceCurrency: "USD",
    }),
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

export async function getUserUpdates() {
  const res = await fetch(`${API_BASE_URL}/api/v1/user/updates`, {
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

export async function getTransferRecipients(includeSelf?: boolean) {
    const query = includeSelf ? "?includeSelf=true" : "";
    const res = await fetch(`${API_BASE_URL}/api/v1/user/transfer-recipients${query}`, {
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

export async function executeTransfer(
    recipientId: string,
    amount: number,
    transferType?: 'TO_AVAILABLE_BALANCE' | 'TO_PACKAGE',
    password?: string,
    otp?: string,
    faceVerificationId?: string,
    idempotencyKey?: string,
    roiPlanType?: 'old' | 'new',
) {
    const body: { recipientId: string; amount: number; transferType?: string; password?: string; otp?: string; faceVerificationId?: string; roiPlanType?: string; } = {
        recipientId,
        amount,
    };

    if (transferType) {
        body.transferType = transferType;
    }
    if (roiPlanType) {
        body.roiPlanType = roiPlanType;
    }
    if (password) {
        body.password = password;
    } else if (otp) {
        body.otp = otp;
    } else if (faceVerificationId) {
        body.faceVerificationId = faceVerificationId;
    }

    const headers = await getAuthHeaders();
    if (idempotencyKey) {
        headers["Idempotency-Key"] = idempotencyKey;
    }
    const res = await fetch(`${API_BASE_URL}/api/v1/wallet/transfer/execute`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
    });
    return handleApiResponse(res);
}

export async function createCryptoDepositInvoice(amount: number, roiPlanType?: 'old' | 'new') {
    const res = await fetch(`${API_BASE_URL}/api/v1/wallet/deposits/crypto`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ amount, ...(roiPlanType ? { roiPlanType } : {}) }),
      });
      return handleApiResponse(res);
}

export async function requestWithdrawal(data: { 
    amount: number; 
    withdrawalAddress?: string; 
    upiId?: string;
    bankDetails?: {
        bankName: string;
        accountNumber: string;
        ifscCode: string;
        holderName: string;
    };
    otp?: string;
    password?: string;
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

export async function getRewardPrograms() {
    const res = await fetch(`${API_BASE_URL}/api/v1/rewards/programs`, {
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

export async function uploadRewardDocument(rewardId: string, formData: FormData, ticketHolderNumber: number) {
    formData.append('ticketHolderNumber', ticketHolderNumber.toString());
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

export async function generateSgGoldCode(sagenexUserId: string) {
    const res = await fetch(`${API_BASE_URL}/api/v1/sggold/generate`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({
            sagenexUserId,
            platform: "sggold",
        }),
    });
    return handleApiResponse(res);
}

export async function getTicketBalance() {
    const res = await fetch(`${API_BASE_URL}/api/v1/user/tickets/me`, {
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

export async function initiateTransferToSGChain(amount: number) {
    const res = await fetch(`${API_BASE_URL}/api/v1/wallet/transfer-to-sgchain/initiate`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ amount }),
    });
    return handleApiResponse(res);
}

// --- Tests ---

export async function getTestsCatalog() {
    const res = await fetch(`${API_BASE_URL}/api/v1/tests/catalog`, {
        headers: await getAuthHeaders(),
      });
      return handleApiResponse(res);
}

export async function sendTestOtp(payload: {
    testId: string;
    locationId: string;
    userInfo: {
        firstName: string;
        lastName: string;
        phone: string;
        email: string;
        age?: number;
    };
}) {
    const res = await fetch(`${API_BASE_URL}/api/v1/tests/send-otp`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify(payload),
    });
    return handleApiResponse(res);
}

export async function scheduleTestBooking(payload: {
    testId: string;
    locationId: string;
    userInfo: {
        firstName: string;
        lastName: string;
        phone: string;
        email: string;
        age?: number;
    };
    otp?: string;
    password?: string;
    idempotencyKey: string;
}) {
    const body: Record<string, unknown> = {
        testId: payload.testId,
        locationId: payload.locationId,
        userInfo: payload.userInfo,
        idempotencyKey: payload.idempotencyKey,
    };
    if (payload.otp) {
        body.otp = payload.otp;
    } else if (payload.password) {
        body.password = payload.password;
    }
    const res = await fetch(`${API_BASE_URL}/api/v1/tests/schedule`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify(body),
    });
    return handleApiResponse(res);
}

export async function getTestBookings() {
    const res = await fetch(`${API_BASE_URL}/api/v1/tests`, {
        headers: await getAuthHeaders(),
    });
    return handleApiResponse(res);
}

export async function getTestBooking(bookingId: string) {
    const res = await fetch(`${API_BASE_URL}/api/v1/tests/${bookingId}`, {
        headers: await getAuthHeaders(),
    });
    return handleApiResponse(res);
}

export async function cancelTestBooking(bookingId: string, reason?: string) {
    const res = await fetch(`${API_BASE_URL}/api/v1/tests/${bookingId}/cancel`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ reason }),
    });
    return handleApiResponse(res);
}

// --- Online Tests ---

export async function getOnlineTestsCatalog() {
    const res = await fetch(`${API_BASE_URL}/api/v1/tests/online/catalog`, {
        headers: await getAuthHeaders(),
    });
    return handleApiResponse(res);
}

export async function getOnlineTestState(testId: string) {
    const params = new URLSearchParams({ testId });
    const res = await fetch(`${API_BASE_URL}/api/v1/tests/online/state?${params.toString()}`, {
        headers: await getAuthHeaders(),
    });
    return handleApiResponse(res);
}

export async function getOnlineTestAttempts(testId?: string) {
    const params = new URLSearchParams();
    if (testId) {
        params.set("testId", testId);
    }
    const url = params.toString()
        ? `${API_BASE_URL}/api/v1/tests/online/attempts?${params.toString()}`
        : `${API_BASE_URL}/api/v1/tests/online/attempts`;
    const res = await fetch(url, {
        headers: await getAuthHeaders(),
    });
    return handleApiResponse(res);
}

export async function sendOnlineTestOtp(payload: { testId: string }) {
    const res = await fetch(`${API_BASE_URL}/api/v1/tests/online/send-otp`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify(payload),
    });
    return handleApiResponse(res);
}

export async function purchaseOnlineTest(payload: {
    testId: string;
    idempotencyKey: string;
    otp?: string;
    password?: string;
}) {
    const body: Record<string, unknown> = {
        testId: payload.testId,
        idempotencyKey: payload.idempotencyKey,
    };
    if (payload.otp) {
        body.otp = payload.otp;
    } else if (payload.password) {
        body.password = payload.password;
    }
    const res = await fetch(`${API_BASE_URL}/api/v1/tests/online/purchase`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify(body),
    });
    return handleApiResponse(res);
}

export async function startOnlineTestAttempt(payload: {
    testId: string;
    language: string;
}) {
    const res = await fetch(`${API_BASE_URL}/api/v1/tests/online/start`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify(payload),
    });
    return handleApiResponse(res);
}

export async function getOnlineTestAttempt(attemptId: string) {
    const res = await fetch(`${API_BASE_URL}/api/v1/tests/online/attempts/${attemptId}`, {
        headers: await getAuthHeaders(),
    });
    return handleApiResponse(res);
}

export async function getOnlineTestQuestion(
    attemptId: string,
    index: number,
    language: string,
    session?: string
) {
    const params = new URLSearchParams({
        index: String(index),
        language,
    });
    const headers = await getAuthHeaders();
    if (session) {
        headers["x-exam-session"] = session;
    }
    const res = await fetch(
        `${API_BASE_URL}/api/v1/tests/online/attempts/${attemptId}/question?${params.toString()}`,
        {
            headers,
        }
    );
    return handleApiResponse(res);
}

export async function saveOnlineTestAnswer(
    attemptId: string,
    payload: { questionId: string; optionId: string },
    session?: string
) {
    const headers = await getAuthHeaders();
    if (session) {
        headers["x-exam-session"] = session;
    }
    const body = session ? { ...payload, session } : payload;
    const res = await fetch(
        `${API_BASE_URL}/api/v1/tests/online/attempts/${attemptId}/answer`,
        {
            method: "POST",
            headers,
            body: JSON.stringify(body),
        }
    );
    return handleApiResponse(res);
}

export async function submitOnlineTestAttempt(attemptId: string, session?: string) {
    const headers = await getAuthHeaders();
    if (session) {
        headers["x-exam-session"] = session;
    }
    const res = await fetch(
        `${API_BASE_URL}/api/v1/tests/online/attempts/${attemptId}/submit`,
        {
            method: "POST",
            headers,
            body: JSON.stringify({ session }),
        }
    );
    return handleApiResponse(res);
}

export async function endOnlineTestAttempt(attemptId: string, session?: string) {
    const headers = await getAuthHeaders();
    if (session) {
        headers["x-exam-session"] = session;
    }
    const res = await fetch(
        `${API_BASE_URL}/api/v1/tests/online/attempts/${attemptId}/end`,
        {
            method: "POST",
            headers,
            body: JSON.stringify({ session }),
        }
    );
    return handleApiResponse(res);
}

export async function consumeOnlineTestSession(session: string) {
    const headers = await getAuthHeaders();
    headers["x-exam-session"] = session;
    const res = await fetch(`${API_BASE_URL}/api/v1/tests/online/session/consume`, {
        method: "POST",
        headers,
        body: JSON.stringify({ session }),
    });
    return handleApiResponse(res);
}

export async function redeemFromSGChain(code: string) {
    const res = await fetch(`${API_BASE_URL}/api/v1/wallet/redeem-from-sgchain`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ code }),
    });
    return handleApiResponse(res);
}

// --- Lottery ---

export async function getActiveLotteryPools() {
    const res = await fetch(`${API_BASE_URL}/api/v1/lottery/pools/active`, {
        headers: await getAuthHeaders(),
    });
    return handleApiResponse(res);
}

export async function sendLotteryOtp() {
    const res = await fetch(`${API_BASE_URL}/api/v1/lottery/send-otp`, {
        method: "POST",
        headers: await getAuthHeaders(),
    });
    return handleApiResponse(res);
}

export async function getLotteryPoolDetails(poolId: string) {
    const res = await fetch(`${API_BASE_URL}/api/v1/lottery/pools/${poolId}`, {
        headers: await getAuthHeaders(),
    });
    return handleApiResponse(res);
}

export async function buyLotteryTickets(
    poolId: string,
    quantity: number,
    payload?: { otp?: string; password?: string }
) {
    const body: { quantity: number; otp?: string; password?: string } = { quantity };
    if (payload?.otp) {
        body.otp = payload.otp;
    } else if (payload?.password) {
        body.password = payload.password;
    }
    const res = await fetch(`${API_BASE_URL}/api/v1/lottery/pools/${poolId}/buy`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify(body),
    });
    return handleApiResponse(res);
}

// --- Expense Management ---

export async function getExpenseMetadata() {
    const res = await fetch(`${API_BASE_URL}/api/v1/user/expenses/meta-data`, {
        headers: await getAuthHeaders(),
    });
    return handleApiResponse(res);
}

export async function requestExpenseTicket(description: string) {
    const res = await fetch(`${API_BASE_URL}/api/v1/user/expenses/tickets`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ description }),
    });
    return handleApiResponse(res);
}

export async function getMyExpenseTickets(page: number = 1, limit: number = 10) {
    const res = await fetch(`${API_BASE_URL}/api/v1/user/expenses/tickets?page=${page}&limit=${limit}`, {
        headers: await getAuthHeaders(),
    });
    return handleApiResponse(res);
}

export async function getSingleExpenseTicket(ticketId: string) {
    const res = await fetch(`${API_BASE_URL}/api/v1/user/expenses/tickets/${ticketId}`, {
        headers: await getAuthHeaders(),
    });
    return handleApiResponse(res);
}

export async function addExpenseItem(ticketId: string, formData: FormData) {
    const res = await fetch(`${API_BASE_URL}/api/v1/user/expenses/tickets/${ticketId}/items`, {
        method: "POST",
        headers: await getAuthHeaders(false),
        body: formData,
    });
    return handleApiResponse(res);
}

export async function removeExpenseItem(ticketId: string, itemId: string) {
    const res = await fetch(`${API_BASE_URL}/api/v1/user/expenses/tickets/${ticketId}/items/${itemId}`, {
        method: "DELETE",
        headers: await getAuthHeaders(),
    });
    return handleApiResponse(res);
}

export async function submitExpenseTicket(ticketId: string) {
    const res = await fetch(`${API_BASE_URL}/api/v1/user/expenses/tickets/${ticketId}/submit`, {
        method: "POST",
        headers: await getAuthHeaders(),
    });
    return handleApiResponse(res);
}
