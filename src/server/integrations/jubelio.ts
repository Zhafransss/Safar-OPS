import "server-only";

const LOGIN_TIMEOUT_MS = 10_000;
// The name lookup must not hold up a login for long; without it the user keeps their old name.
const EMPLOYEE_TIMEOUT_MS = 3_000;
const INVALID_CREDENTIALS_CODE = "Invalid email or password";

// `name` is the user's name in Jubelio, or null when Jubelio gave none (U-01).
export type JubelioLoginResult =
  | { ok: true; name: string | null }
  | { ok: false; reason: "invalid_credentials" | "unavailable" };

type JubelioLoginBody = { token?: unknown; fullName?: unknown; code?: unknown };

type MappedLogin =
  | { ok: true; token: string; name: string | null }
  | { ok: false; reason: "invalid_credentials" | "unavailable" };

// A usable display name, or null for blanks and for an email standing in for a name.
export function nameFrom(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const name = value.trim();
  return name && !name.includes("@") ? name.slice(0, 100) : null;
}

// Pure so the response mapping can be tested without network access. userName in the login
// response is the login email, not a name; fullName is not in Jubelio's docs but is sent.
export function mapLoginResponse(status: number, body: JubelioLoginBody | null): MappedLogin {
  if (status >= 200 && status < 300 && typeof body?.token === "string" && body.token.length > 0) {
    return { ok: true, token: body.token, name: nameFrom(body.fullName) };
  }
  // Jubelio reports bad credentials as HTTP 500 with this code, not as 401.
  if (body?.code === INVALID_CREDENTIALS_CODE) return { ok: false, reason: "invalid_credentials" };
  return { ok: false, reason: "unavailable" };
}

// U-01: GET /wms/employee/{email} returns the name set in Jubelio's user settings, for office
// accounts too (tested 18 November: renaming the user in Jubelio changed it). Any failure is null.
async function fetchEmployeeName(baseUrl: string, email: string, token: string): Promise<string | null> {
  try {
    const response = await fetch(`${baseUrl}/wms/employee/${encodeURIComponent(email)}`, {
      headers: { authorization: token },
      signal: AbortSignal.timeout(EMPLOYEE_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const body = (await response.json().catch(() => null)) as { name?: unknown } | null;
    return nameFrom(body?.name);
  } catch {
    return null;
  }
}

// The password is forwarded once and never stored or logged. The token is used for the name
// lookup only, then discarded (DESIGN 4.1).
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
    const result = mapLoginResponse(response.status, body);
    if (!result.ok) return result;
    return { ok: true, name: (await fetchEmployeeName(baseUrl, email, result.token)) ?? result.name };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}
