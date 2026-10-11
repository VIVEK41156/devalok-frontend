// Shared by server and browser code. Only public values live here: the API
// base URL is not a secret, and no credentials are ever placed in NEXT_PUBLIC_*.

/**
 * True when a Laravel API is configured. When it isn't (e.g. the Vercel demo),
 * the site renders the bundled content snapshot (src/data/snapshot.json) and the
 * admin panel and contact form explain that they need the backend.
 */
export const API_CONFIGURED = !!process.env.NEXT_PUBLIC_API_BASE_URL;

/** e.g. https://api.devaloksculptures.in/api/v1 */
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8125/api/v1").replace(/\/+$/, "");

/** Origin of the Laravel app (for /sanctum/csrf-cookie and /storage). */
export const API_ORIGIN = new URL(API_BASE_URL).origin;

/**
 * Uploaded images are served by Laravel at {API_ORIGIN}/storage/... Next.js
 * rewrites /storage/* to that origin (next.config.ts), so we hand next/image a
 * same-origin path and it can optimise the file like any local image.
 */
export function imageSrc(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("/")) return url; // already site-relative (e.g. snapshot /cms-media/...)
  try {
    const u = new URL(url, API_ORIGIN);
    if (u.origin === API_ORIGIN && u.pathname.startsWith("/storage/")) return u.pathname;
    return u.toString();
  } catch {
    return "";
  }
}
