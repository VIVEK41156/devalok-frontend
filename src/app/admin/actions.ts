"use server";

import { cookies } from "next/headers";
import { updateTag } from "next/cache";
import { API_BASE_URL } from "@/lib/api-config";

/**
 * Called by the admin panel after a successful save so the public website
 * shows the change immediately instead of after the cache lifetime.
 * Only runs for a signed-in CMS user: the caller's session cookie is
 * forwarded to Laravel, which must confirm the session first.
 */
export async function refreshPublicSite(): Promise<{ ok: boolean }> {
  const cookieHeader = (await cookies()).toString();
  if (!cookieHeader) return { ok: false };
  try {
    const res = await fetch(`${API_BASE_URL}/admin/me`, {
      headers: {
        Accept: "application/json",
        Cookie: cookieHeader,
        // Sanctum treats requests from the configured frontend origin as stateful.
        Origin: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3210",
        Referer: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3210"}/admin`,
      },
      cache: "no-store",
    });
    if (!res.ok) return { ok: false };
  } catch {
    return { ok: false };
  }
  updateTag("cms");
  return { ok: true };
}
