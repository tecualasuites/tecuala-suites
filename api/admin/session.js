import { applyRateLimitHeaders, checkRateLimit, getClientIp, parseCookies, rateLimited, SESSION_COOKIE, setSecurityHeaders, verifySessionToken } from "../_auth.js";

export default async function handler(req, res) {
  setSecurityHeaders(res);
  res.setHeader("Cache-Control", "no-store");

  const limit = 120;
  const rateLimit = checkRateLimit({
    key: `admin-session:${getClientIp(req)}`,
    limit,
    windowMs: 60 * 1000
  });
  if (!rateLimit.allowed) return rateLimited(res, rateLimit, limit);
  applyRateLimitHeaders(res, rateLimit, limit);

  const cookies = parseCookies(req.headers.cookie || "");
  const authenticated = verifySessionToken(cookies[SESSION_COOKIE]);
  return res.status(authenticated ? 200 : 401).json({ authenticated });
}

