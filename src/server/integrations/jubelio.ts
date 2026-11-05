import "server-only";

const LOGIN_TIMEOUT_MS = 10_000;
const INVALID_CREDENTIALS_CODE = "Invalid email or password";

export type JubelioLoginResult =
  | { ok: true; userName: string }
  | { ok: false; reason: "invalid_credentials" | "unavailable" };

type JubelioLoginBody = { token?: unknown; userName?: unknown; code?: unknown };

// Pure so the response mapping can be tested without network access.
export function mapLoginResponse(status: number, body: JubelioLoginBody | null, email: string): JubelioLoginResult {
  if (status >= 200 && status < 300 && typeof body?.token === "string" && body.token.length > 0) {
    return { ok: true, userName: typeof body.userName === "string" ? body.userName : email };
  }
  // Jubelio reports bad credentials as HTTP 500 with this code, not as 401.
  if (body?.code === INVALID_CREDENTIALS_CODE) return { ok: false, reason: "invalid_credentials" };
  return { ok: false, reason: "unavailable" };
}

// The password is forwarded once and never stored or logged. The returned token is discarded (DESIGN 4.1).
export async function loginWithJubelio(email: string, password: string): Promise<JubelioLoginResult> {
  const baseUrl = process.env.JUBELIO_BASE_URL ?? "https://api2.jubelio.com";
  try {
    const response = await fetch(`${baseUrl}/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
      signal: AbortSignal.timeout(LOGIN_TIMEOUT_MS),
      cache: "no-store",
    });
    const body = (await response.json().catch(() => null)) as JubelioLoginBody | null;
    return mapLoginResponse(response.status, body, email);
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}
