/**
 * API Client Setup
 * Base URL: http://localhost:8080/api/v1
 * All requests include Authorization: Bearer {token}
 */

const rawBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'http://localhost:8080';
const API_BASE_URL = rawBaseUrl.endsWith('/api/v1')
  ? rawBaseUrl
  : `${rawBaseUrl.replace(/\/$/, '')}/api/v1`;

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

/**
 * Get auth token from cookies
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    // Token is stored in cookies, not localStorage
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'authToken') {
        return decodeURIComponent(value);
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Unified fetch wrapper with auth header and error handling
 */
async function apiFetch(endpoint: string, options: FetchOptions = {}) {
  const token = getAuthToken();
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json();

  // Handle errors without auto-redirect
  // Let the calling code decide what to do with 401s
  if (!response.ok) {
    const error = new Error(data.message || `API Error: ${response.status}`);
    (error as any).status = response.status;
    (error as any).data = data;
    throw error;
  }

  return data;
}

/**
 * HTTP methods
 */
export const api = {
  get: (endpoint: string) => apiFetch(endpoint),
  post: (endpoint: string, body?: any) =>
    apiFetch(endpoint, {
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  put: (endpoint: string, body: any) =>
    apiFetch(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint: string) => apiFetch(endpoint, { method: 'DELETE' }),
};

export default api;
