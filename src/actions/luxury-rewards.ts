"use server";
import { cookies } from 'next/headers';
import { getBackendBaseUrl } from '@/lib/api-base';

const API_BASE_URL = getBackendBaseUrl('http://localhost:8080');

async function authedHeaders() {
  const token = (await cookies()).get('authToken')?.value;
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

async function handle(res: Response) {
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  if (!res.ok) return { error: data?.message || `HTTP ${res.status}` };
  return data;
}

export async function getLuxuryProgress() {
  const res = await fetch(`${API_BASE_URL}/api/v1/luxury-rewards/me`, {
    headers: await authedHeaders(), cache: 'no-store',
  });
  return handle(res);
}

export async function getLuxuryHistory() {
  const res = await fetch(`${API_BASE_URL}/api/v1/luxury-rewards/me/history`, {
    headers: await authedHeaders(), cache: 'no-store',
  });
  return handle(res);
}

export async function claimLuxuryReward(cycleId: string) {
  const res = await fetch(`${API_BASE_URL}/api/v1/luxury-rewards/cycles/${cycleId}/claim`, {
    method: 'POST', headers: await authedHeaders(),
  });
  return handle(res);
}
