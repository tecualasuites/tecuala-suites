import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "tecuala_admin_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 8;

function base64UrlEncode(value) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET must be set to at least 32 characters.");
  }
  return secret;
}

export function signValue(value) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

export function createSessionCookie() {
  const now = Math.floor(Date.now() / 1000);
  const payload = base64UrlEncode(JSON.stringify({ role: "admin", iat: now, exp: now + SESSION_TTL_SECONDS }));
  return `${payload}.${signValue(payload)}`;
}

export function verifySessionToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return false;

  const [payload, signature] = token.split(".");
  const expectedSignature = signValue(payload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) return false;

  try {
    const data = JSON.parse(base64UrlDecode(payload));
    return data.role === "admin" && Number(data.exp) > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function parseCookies(cookieHeader = "") {
  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map((cookie) => cookie.trim())
      .filter(Boolean)
      .map((cookie) => {
        const index = cookie.indexOf("=");
        if (index === -1) return [cookie, ""];
        return [decodeURIComponent(cookie.slice(0, index)), decodeURIComponent(cookie.slice(index + 1))];
      })
  );
}

export function getClientIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

export function setSecurityHeaders(res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("X-Frame-Options", "DENY");
}

export function methodNotAllowed(res, allowed) {
  res.setHeader("Allow", allowed);
  return res.status(405).json({ error: "Method not allowed" });
}
