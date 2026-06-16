import { parseCookies, SESSION_COOKIE, setSecurityHeaders, verifySessionToken } from "../_auth.js";

export default async function handler(req, res) {
  setSecurityHeaders(res);
  res.setHeader("Cache-Control", "no-store");

  const cookies = parseCookies(req.headers.cookie || "");
  const authenticated = verifySessionToken(cookies[SESSION_COOKIE]);
  return res.status(authenticated ? 200 : 401).json({ authenticated });
}
