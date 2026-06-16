import { setSecurityHeaders } from "./_auth.js";

export default async function handler(req, res) {
  setSecurityHeaders(res);
  res.setHeader("Cache-Control", "public, max-age=300");

  return res.status(200).json({
    whatsappNumber: process.env.PUBLIC_WHATSAPP_NUMBER || "",
    businessEmail: process.env.PUBLIC_BUSINESS_EMAIL || ""
  });
}
