import { applyRateLimitHeaders, checkRateLimit, createSessionCookie, getClientIp, methodNotAllowed, rateLimited, SESSION_COOKIE, SESSION_TTL_SECONDS, setSecurityHeaders } from "../_auth.js";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
function isValidPassword(password) {
  const expected = process.env.ADMIN_PASSWORD;
  return Boolean(expected && password && password === expected);
}

export default async function handler(req, res) {
  setSecurityHeaders(res);
  if (req.method !== "POST") return methodNotAllowed(res, "POST");

  const ip = getClientIp(req);
  const rateLimit = checkRateLimit({
    key: `admin-login:${ip}`,
    limit: MAX_ATTEMPTS,
    windowMs: WINDOW_MS
  });
  if (!rateLimit.allowed) return rateLimited(res, rateLimit, MAX_ATTEMPTS);
  applyRateLimitHeaders(res, rateLimit, MAX_ATTEMPTS);

  const { password } = typeof req.body === "object" && req.body ? req.body : {};
  if (!isValidPassword(password)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = createSessionCookie();
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}`
  );
  return res.status(200).json({ ok: true, expiresIn: SESSION_TTL_SECONDS });
}

