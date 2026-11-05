import { del, list, put } from "@vercel/blob";
import sharp from "sharp";
import { checkRateLimit, getClientIp, methodNotAllowed, parseCookies, rateLimited, SESSION_COOKIE, setSecurityHeaders, verifySessionToken } from "./_auth.js";

const prefix = "suite-photos/";
const pathPattern = /^suite-photos\/(two-bedroom-[12]|one-bedroom-[1-4])\/([1-4])\.jpg$/;
const maxEncodedLength = 800_000;

function photo(blob) {
  const url = new URL(blob.url);
  url.searchParams.set("v", new Date(blob.uploadedAt).getTime());
  return { url: url.href };
}

export default async function handler(req, res) {
  setSecurityHeaders(res);
  res.setHeader("Cache-Control", "no-store");
  const reading = req.method === "GET";
  if (!reading && !["POST", "DELETE"].includes(req.method)) return methodNotAllowed(res, "GET, POST, DELETE");
  if (!reading) {
    const cookies = parseCookies(req.headers.cookie || "");
    if (!verifySessionToken(cookies[SESSION_COOKIE])) return res.status(401).json({ error: "session" });
    if (req.headers.origin !== `https://${req.headers.host}`) return res.status(403).json({ error: "origin" });
    if (req.headers["content-type"]?.split(";")[0] !== "application/json") {
      return res.status(415).json({ error: "format" });
    }
  }
  const limit = reading ? 120 : 20;
  const rate = checkRateLimit({ key: `suite-photos:${reading}:${getClientIp(req)}`, limit, windowMs: 60_000 });
  if (!rate.allowed) return rateLimited(res, rate, limit);
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return reading ? res.json({ photos: {}, enabled: false }) : res.status(503).json({ error: "storage" });
  }
  try {
    if (reading) {
      const { blobs } = await list({ prefix, limit: 100 });
      const photos = {};
      for (const blob of blobs) {
        const match = pathPattern.exec(blob.pathname);
        if (!match) continue;
        const [, suite, slot] = match;
        (photos[suite] ??= {})[slot] = photo(blob);
      }
      res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
      res.setHeader("Vercel-CDN-Cache-Control", "public, s-maxage=15");
      return res.json({ photos, enabled: true });
    }
    const { suite, slot, image } = req.body || {};
    const path = `${prefix}${suite}/${slot}.jpg`;
    if (typeof suite !== "string" || !Number.isInteger(slot) || !pathPattern.test(path)) {
      return res.status(400).json({ error: "slot" });
    }
    if (req.method === "DELETE") {
      await del(path);
      return res.json({ photo: null });
    }
    if (typeof image !== "string" || image.length > maxEncodedLength || !/^[A-Za-z0-9+/]+={0,2}$/.test(image)) {
      return res.status(400).json({ error: "image" });
    }
    const bytes = Buffer.from(image, "base64");
    if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) return res.status(400).json({ error: "image" });
    let jpeg;
    try {
      jpeg = await sharp(bytes, { limitInputPixels: 4_000_000 })
        .rotate().resize(1440, 1440, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 84 }).toBuffer();
    } catch {
      return res.status(400).json({ error: "image" });
    }
    const blob = await put(path, jpeg, {
      access: "public", contentType: "image/jpeg", allowOverwrite: true, cacheControlMaxAge: 60
    });
    return res.json({ photo: photo({ ...blob, uploadedAt: new Date() }) });
  } catch {
    return res.status(502).json({ error: "storage" });
  }
}
