const PUBLIC_EXACT_ROUTES = new Set([
  "/",
  "/login",
  "/terms",
  "/privacy",
  "/support",
  "/support-guidelines",
  "/about-us",
  "/sgbn",
  "/sgse",
  "/package",
  "/levels",
  "/timeline",
  "/impersonation-login",
]);

function normalizePath(pathname: string) {
  if (!pathname) return "/";
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed || "/";
}

export function isPublicRoute(pathname: string) {
  return PUBLIC_EXACT_ROUTES.has(normalizePath(pathname));
}

export function isPrivateRoute(pathname: string) {
  return !isPublicRoute(pathname);
}

export function getSafeRedirectPath(path: string | null | undefined) {
  if (!path) return undefined;
  const normalized = normalizePath(path);
  if (!isPrivateRoute(normalized) || normalized === "/login") return undefined;
  return normalized;
}
