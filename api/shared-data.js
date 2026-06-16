import { methodNotAllowed, setSecurityHeaders } from "./_auth.js";

export default async function handler(req, res) {
  setSecurityHeaders(res);
  if (req.method !== "GET") return methodNotAllowed(res, "GET");

  const endpoint = process.env.GOOGLE_APPS_SCRIPT_EXEC_URL;
  const sharedSecret = process.env.APPS_SCRIPT_SHARED_SECRET;
  if (!endpoint || !sharedSecret) {
    return res.status(500).json({ error: "Shared booking endpoint is not configured." });
  }

  const url = new URL(endpoint);
  url.searchParams.set("token", sharedSecret);

  const response = await fetch(url, { cache: "no-store" });
  const text = await response.text();
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  return res.status(response.status).send(text);
}
