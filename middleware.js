const SESSION_COOKIE = "tecuala_admin_session";

function base64UrlToBytes(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function bytesToBase64Url(bytes) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function signValue(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return bytesToBase64Url(new Uint8Array(signature));
}

async function isValidSession(token) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || !token || !token.includes(".")) return false;

  const [payload, signature] = token.split(".");
  const expected = await signValue(payload, secret);
  if (signature !== expected) return false;

  try {
    const data = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload)));
    return data.role === "admin" && Number(data.exp) > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export default async function middleware(request) {
  const url = new URL(request.url);
  const { pathname } = url;
  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");
  const isLoginPath = pathname === "/admin-login";

  if (isAdminPath) {
    const token = getCookie(request.headers.get("cookie") || "", SESSION_COOKIE);
    if (!(await isValidSession(token))) {
      const loginUrl = new URL("/admin-login", request.url);
      return Response.redirect(loginUrl, 302);
    }
  }

  if (isLoginPath && (await isValidSession(getCookie(request.headers.get("cookie") || "", SESSION_COOKIE)))) {
    const adminUrl = new URL("/admin", request.url);
    return Response.redirect(adminUrl, 302);
  }
}

function getCookie(cookieHeader, name) {
  return cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/admin-login"]
};
