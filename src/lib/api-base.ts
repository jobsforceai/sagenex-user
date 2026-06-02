const stripApiSuffix = (url: string) =>
  url.replace(/\/+$/, "").replace(/\/api\/v1$/i, "").replace(/\/api$/i, "");

export const getBackendBaseUrl = (fallback = "") => {
  const rawBaseUrl =
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    fallback;

  return rawBaseUrl ? stripApiSuffix(rawBaseUrl) : "";
};

export const getApiV1BaseUrl = (fallback = "") => {
  const backendBaseUrl = getBackendBaseUrl(fallback);
  return backendBaseUrl ? `${backendBaseUrl}/api/v1` : "/api/v1";
};
