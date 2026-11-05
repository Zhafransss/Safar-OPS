// Second line of defence against cross-site requests, behind the SameSite=Lax session cookie:
// a browser always sends Origin on a POST, and it must be this app's own host.
export function isCrossSite(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return new URL(origin).host !== host;
  } catch {
    return true;
  }
}
