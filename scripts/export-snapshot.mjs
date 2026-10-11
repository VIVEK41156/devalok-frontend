// Exports the current CMS content into the frontend so the site can run
// without the Laravel API (e.g. a Vercel demo).
//
//   node scripts/export-snapshot.mjs [apiBase]
//
// - fetches GET {apiBase}/site (published content only — the public endpoint)
// - copies every referenced uploaded image from backend/storage/app/public
//   into public/cms-media and rewrites the URLs to /cms-media/...
// - writes src/data/snapshot.json
//
// Re-run it whenever the demo should reflect newer CMS content.

import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const api = (process.argv[2] ?? "http://127.0.0.1:8125/api/v1").replace(/\/+$/, "");
const storage = join(root, "backend", "storage", "app", "public");
const outDir = join(root, "public", "cms-media");

const res = await fetch(`${api}/site`, { headers: { Accept: "application/json" } });
if (!res.ok) throw new Error(`API responded ${res.status}`);
const body = await res.json();

let copied = 0;
const seen = new Set();
const json = JSON.stringify(body).replace(/https?:\\?\/\\?\/[^"\\]+?\\?\/storage\\?\/(media\\?\/[^"]+?\.(?:jpe?g|png|webp))/g, (_m, rel) => {
  const clean = rel.replace(/\\\//g, "/");
  if (!seen.has(clean)) {
    seen.add(clean);
    const src = join(storage, clean);
    if (!existsSync(src)) throw new Error(`Missing media file: ${src}`);
    const dest = join(outDir, clean.replace(/^media\//, ""));
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(src, dest);
    copied++;
  }
  return `/cms-media/${clean.replace(/^media\//, "")}`;
});

const data = JSON.parse(json).data;
writeFileSync(join(root, "src", "data", "snapshot.json"), JSON.stringify({ exportedAt: new Date().toISOString(), data }, null, 1));
console.log(`snapshot: ${data.sculptures.length} sculptures, ${data.categories.length} categories, ${data.reviews?.length ?? 0} reviews, ${copied} images`);
