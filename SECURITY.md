# Security Hardening Report

## Vulnerabilities Ranked Before Changes

### Critical

- `/admin` used client-side PIN authentication. The PIN was embedded in the shipped JavaScript and could be found or bypassed by inspecting the browser bundle.
- Google Apps Script accepted public POST requests for WhatsApp click logging without authentication, allowing unauthorized writes to the backing Google Sheet.

### High

- Sensitive operational values were hardcoded in client source, including the admin PIN and Google Apps Script endpoint.
- There was no server-side admin session, no HttpOnly cookie, no logout, and no session expiration.
- Public browser code called Google Apps Script directly, exposing the Apps Script endpoint and preventing server-side request signing.

### Medium

- Admin login attempts were not rate limited.
- Admin routes were not explicitly marked `noindex`/`nofollow`.
- Security headers were not centrally configured through Vercel.

### Low

- Some public business configuration, such as WhatsApp number and email, lived directly in the client bundle.
- Admin data stored in localStorage is device-local and should not be treated as protected server-side storage.

## Changes Made

### 1. Removed Client-Side PIN Authentication

Removed the hardcoded `ADMIN_PIN` constant and the React PIN unlock form from `src/main.jsx`.

Admin access now starts at `/admin-login`, which submits credentials to `/api/admin/login`.

### 2. Added Server-Side Authentication for `/admin`

Added Vercel serverless admin auth endpoints:

- `api/admin/login.js`
- `api/admin/logout.js`
- `api/admin/session.js`
- `api/_auth.js`

Successful login creates a signed HttpOnly cookie named `tecuala_admin_session`.

Added `middleware.js` to protect `/admin` before the React app loads. Unauthenticated users are redirected to `/admin-login`.

### 3. Moved Sensitive Values to Vercel Environment Variables

Added `.env.example` with placeholders only.

Required Vercel environment variable names:

- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `APPS_SCRIPT_SHARED_SECRET`
- `GOOGLE_APPS_SCRIPT_EXEC_URL`
- `PUBLIC_WHATSAPP_NUMBER`
- `PUBLIC_BUSINESS_EMAIL`

No real values are committed in `.env.example`.

### 4. Added Rate Limiting to Admin Login

`api/admin/login.js` limits login attempts to 5 attempts per IP per 15 minutes.

This is an in-memory limiter suitable for the current MVP. For higher traffic or multi-region precision, replace it with a durable store such as Upstash Redis or Vercel KV.

### 5. Added Session Expiration and Logout

Admin sessions expire after 8 hours.

Added logout functionality through `/api/admin/logout`, which clears the HttpOnly session cookie and redirects back to `/admin-login`.

### 6. Added Security Headers Through Vercel

Updated `vercel.json` with:

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `X-Frame-Options: DENY`
- `X-Robots-Tag: noindex, nofollow, noarchive` for admin routes
- `Cache-Control: no-store` for admin routes

### 7. Protected Google Apps Script from Unauthorized Requests

The public React app no longer calls Google Apps Script directly.

New serverless proxy endpoints:

- `api/shared-data.js` fetches shared availability/click stats from Apps Script with a server-side shared secret.
- `api/whatsapp-click.js` validates click payloads and forwards them to Apps Script with the shared secret.

Apps Script now checks the shared secret before returning data or accepting writes.

### 8. Added Apps Script POST Request Validation

`google-apps-script/Code.gs` now validates WhatsApp click payloads before appending to the sheet:

- Required shape exists.
- `clickedAt` is a valid timestamp.
- Suite ID is one of the allowed suite IDs or `floating`.
- Dates match `YYYY-MM-DD` or are blank.
- Text fields are length-limited.

### 9. Prevented Search Engines from Indexing Admin Pages

Admin routes receive `X-Robots-Tag: noindex, nofollow, noarchive` through `vercel.json` and middleware redirects.

### 10. Hardcoded Secret Audit

The codebase was searched for hardcoded secrets and direct environment leaks using patterns including:

- `ADMIN_PIN`
- `SHARED_BOOKINGS_URL`
- `script.google`
- `AKfyc`
- `523891`
- `2468`
- `PASSWORD`
- `TOKEN`
- `SECRET`
- `process.env`
- `import.meta.env`

Hardcoded admin PIN and direct Apps Script URL were removed from `src/main.jsx`.

## Booking Flow After Hardening

The public booking flow and design are unchanged:

1. Visitor selects dates and guest count.
2. React fetches availability from `/api/shared-data`.
3. `/api/shared-data` securely fetches Google Apps Script using `APPS_SCRIPT_SHARED_SECRET`.
4. React calculates availability using the same overlap logic.
5. Visitor clicks WhatsApp.
6. React opens WhatsApp and posts click analytics to `/api/whatsapp-click`.
7. `/api/whatsapp-click` validates the request and securely forwards it to Apps Script.

## Admin Flow After Hardening

1. Admin opens `/admin`.
2. Middleware checks for a valid signed session cookie.
3. If missing or expired, admin is redirected to `/admin-login`.
4. Admin submits password to `/api/admin/login`.
5. Server validates against `ADMIN_PASSWORD` and rate limits failed attempts.
6. Server sets an HttpOnly signed session cookie.
7. Admin can access `/admin` until the 8-hour session expires or logout is clicked.

## Deployment Checklist

Set these values in Vercel Project Settings > Environment Variables for Production, Preview, and Development as needed:

- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `APPS_SCRIPT_SHARED_SECRET`
- `GOOGLE_APPS_SCRIPT_EXEC_URL`
- `PUBLIC_WHATSAPP_NUMBER`
- `PUBLIC_BUSINESS_EMAIL`

Set the same `APPS_SCRIPT_SHARED_SECRET` in Google Apps Script Script Properties with property name:

- `APPS_SCRIPT_SHARED_SECRET`

Then redeploy the Google Apps Script web app and redeploy Vercel.

## Current Deployment Status

- Vercel environment variables were added for the hardened site deployment.
- The Vercel site-side protections are deployed: admin login is server-side, `/admin` redirects unauthenticated users, and security/noindex headers are present.
- The hardened Google Apps Script code is committed and pushed to the Apps Script project HEAD, but the live Apps Script web app was rolled back to version 3 to avoid breaking the existing site while Google refused remote execution of `setSharedSecret`.
- To activate Apps Script authorization enforcement, set the Script Property `APPS_SCRIPT_SHARED_SECRET` to the same value as Vercel's `APPS_SCRIPT_SHARED_SECRET`, then deploy the latest Apps Script code as a new web app version.

## Remaining Security Notes

- `PUBLIC_WHATSAPP_NUMBER` and `PUBLIC_BUSINESS_EMAIL` are public by nature because they are displayed/used in the browser. They are still configured through environment variables for operational hygiene.
- The in-memory rate limiter may reset when Vercel starts a new serverless instance. Use durable storage for stronger brute-force protection.
- LocalStorage admin bookings remain local to the browser and are not a secure database. Shared availability is still controlled by Google Sheets.
## API Rate Limits

Added shared per-IP rate limiting for endpoints that can create cost, quota pressure, or admin abuse:

- `POST /api/admin/login`: 5 requests per 15 minutes per IP.
- `POST /api/whatsapp-click`: 20 requests per minute per IP. This protects the Google Apps Script write path and WhatsApp click logging.
- `GET /api/shared-data`: 120 requests per minute per IP. This protects the Google Apps Script read path and availability feed.
- `GET /api/admin/session`: 120 requests per minute per IP.
- `POST /api/admin/logout`: 30 requests per minute per IP.

Rate-limited responses return HTTP `429` with `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers.

The current limiter is in-memory per Vercel function instance. It is appropriate for this MVP and stops simple abuse, but a durable global limiter such as Vercel Firewall, Upstash Redis, or Vercel KV is recommended if traffic grows or if stronger multi-region enforcement is needed.

