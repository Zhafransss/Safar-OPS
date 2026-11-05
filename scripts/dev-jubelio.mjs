// Local stand-in for POST /login, for developers without a Jubelio account. Run with: pnpm dev:jubelio
// Accepts any @safar.local email with DEV_LOGIN_PASSWORD and forwards every other email to real Jubelio.
// Set JUBELIO_BASE_URL=http://127.0.0.1:54340 in .env.local only. Passwords are never logged.
import http from "node:http";

import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

const PORT = 54340;
const REAL_JUBELIO = "https://api2.jubelio.com";
const DEV_DOMAIN = "@safar.local";
const devPassword = process.env.DEV_LOGIN_PASSWORD;

if (process.env.NODE_ENV === "production") throw new Error("dev-jubelio must not run in production");
if (!devPassword) throw new Error("Set DEV_LOGIN_PASSWORD in .env.local");

function send(res, status, body) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

async function handleLogin(raw, res) {
  const { email = "", password = "" } = JSON.parse(raw || "{}");
  const normalized = String(email).trim().toLowerCase();

  if (normalized.endsWith(DEV_DOMAIN)) {
    if (password === devPassword) return send(res, 200, { token: "dev", userName: normalized, currentCompany: 0 });
    return send(res, 500, { statusCode: 500, code: "Invalid email or password" });
  }

  const upstream = await fetch(`${REAL_JUBELIO}/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: raw,
    signal: AbortSignal.timeout(10_000),
  });
  res.writeHead(upstream.status, { "content-type": "application/json" });
  res.end(await upstream.text());
}

http
  .createServer((req, res) => {
    if (req.method !== "POST" || req.url !== "/login") return send(res, 404, {});
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => handleLogin(raw, res).catch(() => send(res, 502, {})));
  })
  .listen(PORT, "127.0.0.1", () => console.log(`Dev Jubelio listening on 127.0.0.1:${PORT}`));
