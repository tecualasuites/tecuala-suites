import { createSessionCookie, getClientIp, methodNotAllowed, SESSION_COOKIE, SESSION_TTL_SECONDS, setSecurityHeaders } from "../_auth.js";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const attempts = globalThis.__tecualaLoginAttempts || new Map();
globalThis.__tecualaLoginAttempts = attempts;

function getAttemptState(ip) {
  const now = Date.now();
  const current = attempts.get(ip);
  if (!current || current.resetAt <= now) {
    const next = { count: 0, resetAt: now + WINDOW_MS };
    attempts.set(ip, next);
    return next;
  }
  return current;
}

function isValidPassword(password) {
  const expected = process.env.ADMIN_PASSWORD;
  return Boolean(expected && password && password === expected);
}

export default async function handler(req, res) {
  setSecurityHeaders(res);
  if (req.method !== "POST") return methodNotAllowed(res, "POST");

  const ip = getClientIp(req);
  const state = getAttemptState(ip);
  if (state.count >= MAX_ATTEMPTS) {
    const retryAfter = Math.max(1, Math.ceil((state.resetAt - Date.now()) / 1000));
    res.setHeader("Retry-After", String(retryAfter));
    return res.status(429).json({ error: "Too many login attempts. Try again later." });
  }

  const { password } = typeof req.body === "object" && req.body ? req.body : {};
  if (!isValidPassword(password)) {
    state.count += 1;
    return res.status(401).json({ error: "Invalid credentials" });
  }

  attempts.delete(ip);
  const token = createSessionCookie();
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}`
  );
  return res.status(200).json({ ok: true, expiresIn: SESSION_TTL_SECONDS });
}
