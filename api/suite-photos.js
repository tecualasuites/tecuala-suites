import { randomUUID } from "node:crypto";
import { del, list, put } from "@vercel/blob";
import sharp from "sharp";
import { checkRateLimit, getClientIp, methodNotAllowed, parseCookies, rateLimited, SESSION_COOKIE, setSecurityHeaders, verifySessionToken } from "./_auth.js";

const prefix = "suite-photos/";
const suitePattern = /^(two-bedroom-[12]|one-bedroom-[1-4])$/;
const photoIdPattern = /^(?:[1-4]|[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})$/;
const pathPattern = /^suite-photos\/([^/]+)\/([^/]+)\.jpg$/;
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
      const photos = {};
      const blobs = [];
      let cursor;
      do {
        const page = await list({ prefix, limit: 100, cursor });
        blobs.push(...page.blobs);
        cursor = page.hasMore ? page.cursor : undefined;
      } while (cursor);
      blobs.sort((a, b) => new Date(a.uploadedAt) - new Date(b.uploadedAt));
      for (const blob of blobs) {
        const match = pathPattern.exec(blob.pathname);
        if (!match) continue;
        const [, suite, id] = match;
        if (!suitePattern.test(suite) || !photoIdPattern.test(id)) continue;
        (photos[suite] ??= {})[id] = photo(blob);
      }
      res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
      res.setHeader("Vercel-CDN-Cache-Control", "public, s-maxage=15");
      return res.json({ photos, enabled: true });
    }
    const { suite, id, image } = req.body || {};
    if (typeof suite !== "string" || !suitePattern.test(suite)) {
      return res.status(400).json({ error: "suite" });
    }
    if (req.method === "DELETE") {
      if (typeof id !== "string" || !photoIdPattern.test(id)) return res.status(400).json({ error: "photo" });
      await del(`${prefix}${suite}/${id}.jpg`);
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
    const photoId = randomUUID();
    const blob = await put(`${prefix}${suite}/${photoId}.jpg`, jpeg, {
      access: "public", contentType: "image/jpeg", addRandomSuffix: false, cacheControlMaxAge: 60
    });
    return res.json({ id: photoId, photo: photo({ ...blob, uploadedAt: new Date() }) });
  } catch {
    return res.status(502).json({ error: "storage" });
  }
}
