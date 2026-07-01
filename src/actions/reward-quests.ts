"use server";

import { cookies } from "next/headers";
import { getBackendBaseUrl } from "@/lib/api-base";
import type { RewardQuestApi } from "@/app/components/rewards/gamified/types";

const API_BASE_URL = getBackendBaseUrl("http://localhost:8080");

async function authedHeaders() {
  const token = (await cookies()).get("authToken")?.value;
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function handle(res: Response): Promise<RewardQuestApi[] | { error: string }> {
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    return { error: "The server returned an invalid response." };
  }

  if (!res.ok) {
    const message =
      typeof data === "object" && data !== null && "message" in data
        ? String((data as { message?: string }).message)
        : `HTTP ${res.status}`;
    return { error: message };
  }

  if (Array.isArray(data)) return data as RewardQuestApi[];
  if (
    typeof data === "object" &&
    data !== null &&
    "quests" in data &&
    Array.isArray((data as { quests: unknown }).quests)
  ) {
    return (data as { quests: RewardQuestApi[] }).quests;
  }

  return { error: "Unexpected quests response shape." };
}

export async function getRewardQuests(): Promise<RewardQuestApi[] | { error: string }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/rewards/quests`, {
    headers: await authedHeaders(),
    cache: "no-store",
  });
  return handle(res);
}
