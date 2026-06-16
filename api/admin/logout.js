import { methodNotAllowed, SESSION_COOKIE, setSecurityHeaders } from "../_auth.js";

export default async function handler(req, res) {
  setSecurityHeaders(res);
  if (req.method !== "POST") return methodNotAllowed(res, "POST");

  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
  return res.status(200).json({ ok: true });
}
