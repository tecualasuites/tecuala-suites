import { applyRateLimitHeaders, checkRateLimit, getClientIp, methodNotAllowed, rateLimited, SESSION_COOKIE, setSecurityHeaders } from "../_auth.js";

export default async function handler(req, res) {
  setSecurityHeaders(res);
  if (req.method !== "POST") return methodNotAllowed(res, "POST");

  const limit = 30;
  const rateLimit = checkRateLimit({
    key: `admin-logout:${getClientIp(req)}`,
    limit,
    windowMs: 60 * 1000
  });
  if (!rateLimit.allowed) return rateLimited(res, rateLimit, limit);
  applyRateLimitHeaders(res, rateLimit, limit);

  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
  return res.status(200).json({ ok: true });
}

