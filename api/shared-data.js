import { methodNotAllowed, setSecurityHeaders } from "./_auth.js";

const WEBSITE_RATE_CATALOG = {
  "two-bedroom-1": 1500,
  "two-bedroom-2": 1500,
  "one-bedroom-1": 900,
  "one-bedroom-2": 900,
  "one-bedroom-3": 900,
  "one-bedroom-4": 900,
};

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
  if (!response.ok) return res.status(response.status).send(text);

  try {
    const data = JSON.parse(text);
    return res.status(200).json({ ...data, rateCatalog: WEBSITE_RATE_CATALOG });
  } catch {
    return res.status(502).json({ error: "The booking source returned invalid JSON." });
  }
}
