import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";

/**
 * Called by the Laravel backend after every successful admin change
 * (App\Http\Middleware\RevalidateFrontend). Drops the cached CMS data so the
 * next page request — from any visitor — is rendered with fresh content.
 */
export async function POST(request: Request) {
  const expected = process.env.REVALIDATE_SECRET ?? "";
  const given = request.headers.get("x-revalidate-secret") ?? "";
  const ok = expected.length > 0 && given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  if (!ok) return Response.json({ ok: false }, { status: 401 });

  // expire: 0 → the next request waits for fresh data instead of serving stale content.
  revalidateTag("cms", { expire: 0 });
  return Response.json({ ok: true, revalidated: "cms" });
}
