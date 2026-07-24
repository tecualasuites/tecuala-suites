import { applyRateLimitHeaders, checkRateLimit, getClientIp, methodNotAllowed, rateLimited, setSecurityHeaders } from "./_auth.js";

const MAX_TEXT_LENGTH = 500;
const APARTMENT_IDS = new Set([
  "two-bedroom-1",
  "two-bedroom-2",
  "one-bedroom-1",
  "one-bedroom-2",
  "one-bedroom-3",
  "one-bedroom-4",
  "floating"
]);

function isIsoTimestamp(value) {
  return typeof value === "string" && !Number.isNaN(new Date(value).getTime());
}

function isShortText(value) {
  return typeof value === "string" && value.length <= MAX_TEXT_LENGTH;
}

function isValidDate(value) {
  return value === "" || (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function validateClick(click) {
  return Boolean(
    click &&
      isShortText(click.id) &&
      isIsoTimestamp(click.clickedAt) &&
      isShortText(click.pageUrl) &&
      isShortText(click.suiteName) &&
      APARTMENT_IDS.has(click.apartmentId) &&
      isValidDate(click.checkIn || "") &&
      isValidDate(click.checkOut || "") &&
      isShortText(String(click.guests || ""))
  );
}

export default async function handler(req, res) {
  setSecurityHeaders(res);
  if (req.method !== "POST") return methodNotAllowed(res, "POST");

  const limit = 20;
  const rateLimit = checkRateLimit({
    key: `whatsapp-click:${getClientIp(req)}`,
    limit,
    windowMs: 60 * 1000
  });
  if (!rateLimit.allowed) return rateLimited(res, rateLimit, limit);
  applyRateLimitHeaders(res, rateLimit, limit);

  const endpoint = process.env.GOOGLE_APPS_SCRIPT_EXEC_URL;
  const sharedSecret = process.env.APPS_SCRIPT_SHARED_SECRET;
  if (!endpoint || !sharedSecret) {
    return res.status(500).json({ error: "WhatsApp click endpoint is not configured." });
  }

  const { click } = typeof req.body === "object" && req.body ? req.body : {};
  if (!validateClick(click)) {
    return res.status(400).json({ error: "Invalid click payload" });
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "whatsappClick", token: sharedSecret, click })
  });

  return res.status(response.ok ? 200 : 502).json({ ok: response.ok });
}

