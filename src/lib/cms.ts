import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { API_BASE_URL, API_CONFIGURED, imageSrc } from "./api-config";
import snapshot from "@/data/snapshot.json";
import type { Category, ImageAsset, NavItem, PageSection, Sculpture, SiteData, SitePage, SiteSettings } from "@/data/types";

// ── Wire types (subset of the Laravel resources we read) ────────────────────
interface ApiMedia {
  id: number;
  url: string;
  width: number | null;
  height: number | null;
  alt: string | null;
}
interface ApiCategory {
  id: number;
  slug: string;
  name: string;
  short_name: string;
  tagline: string | null;
  description: string | null;
  cover: ApiMedia | null;
  sort_order: number;
  sculptures_count?: number;
  seo_title: string | null;
  seo_description: string | null;
}
interface ApiSculpture {
  id: number;
  slug: string;
  title: string;
  category: { slug: string };
  subject: string | null;
  short_description: string | null;
  description: string | null;
  materials: string | null;
  dimensions: string | null;
  weight: string | null;
  craftsmanship: string | null;
  cover: ApiMedia | null;
  cutout: ApiMedia | null;
  gallery: ApiMedia[];
  detail_views: { label: string; x: number; y: number; zoom: number }[];
  reference: { credit: string; license: string | null; url: string | null } | null;
  is_featured: boolean;
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
}
interface ApiSection {
  key: string;
  eyebrow: string | null;
  heading: string | null;
  heading_accent: string | null;
  description: string | null;
  image: ApiMedia | null;
  cta_label: string | null;
  cta_url: string | null;
  is_visible: boolean;
  sort_order: number;
}
interface ApiPage {
  slug: string;
  title: string;
  intro: string | null;
  content: string | null;
  featured_image: ApiMedia | null;
  seo: { title: string | null; description: string | null; canonical_url: string | null; og_title: string | null; og_description: string | null; og_image: ApiMedia | null };
  sections: ApiSection[] | null;
}
interface ApiMenuItem {
  label: string;
  url: string;
  open_in_new_tab: boolean;
  children?: ApiMenuItem[];
}
interface ApiReview {
  id: number;
  name: string;
  location: string | null;
  rating: number;
  content: string;
  is_sample: boolean;
  avatar: ApiMedia | null;
}
type ApiSettings = Record<string, string | null | { url: string } | undefined>;

// ── Mapping ─────────────────────────────────────────────────────────────────
const asset = (m: ApiMedia | null | undefined, alt = ""): ImageAsset | null =>
  m ? { src: imageSrc(m.url), width: m.width ?? 1200, height: m.height ?? 1500, alt: m.alt || alt } : null;

const EMPTY_IMAGE: ImageAsset = { src: "/images/brand/logo.png", width: 480, height: 563, alt: "" };

function mapSculpture(s: ApiSculpture): Sculpture {
  const cover = asset(s.cover, s.title) ?? { ...EMPTY_IMAGE, alt: s.title };
  const cutout = asset(s.cutout);
  return {
    id: String(s.id),
    slug: s.slug,
    name: s.title,
    category: s.category.slug,
    deity: s.subject ?? "",
    finish: s.materials ?? "",
    summary: s.short_description ?? "",
    description: s.description ?? "",
    image: cover,
    cutout: cutout ? { src: cutout.src, width: cutout.width, height: cutout.height } : undefined,
    gallery: s.gallery.filter((g) => g.url !== s.cover?.url).map((g) => asset(g, s.title)!),
    details: s.detail_views ?? [],
    dimensions: s.dimensions,
    weight: s.weight,
    craftsmanship: s.craftsmanship,
    reference: s.reference ? { credit: s.reference.credit, license: s.reference.license ?? "", url: s.reference.url ?? "" } : undefined,
    featured: s.is_featured,
    order: s.sort_order,
    seoTitle: s.seo_title,
    seoDescription: s.seo_description,
  };
}

function mapCategory(c: ApiCategory): Category {
  return {
    id: c.slug,
    dbId: c.id,
    slug: c.slug,
    name: c.name,
    shortName: c.short_name || c.name,
    tagline: c.tagline ?? "",
    description: c.description ?? "",
    coverImage: imageSrc(c.cover?.url) || EMPTY_IMAGE.src,
    order: c.sort_order,
    count: c.sculptures_count ?? 0,
    seoTitle: c.seo_title,
    seoDescription: c.seo_description,
  };
}

function mapSection(s: ApiSection): PageSection {
  return {
    key: s.key,
    eyebrow: s.eyebrow,
    heading: s.heading,
    headingAccent: s.heading_accent,
    description: s.description,
    image: asset(s.image),
    ctaLabel: s.cta_label,
    ctaUrl: s.cta_url,
    visible: s.is_visible,
    order: s.sort_order,
  };
}

function mapPage(p: ApiPage): SitePage {
  return {
    slug: p.slug,
    title: p.title,
    intro: p.intro,
    content: p.content,
    featuredImage: asset(p.featured_image),
    seo: {
      title: p.seo.title,
      description: p.seo.description,
      canonical: p.seo.canonical_url,
      ogTitle: p.seo.og_title,
      ogDescription: p.seo.og_description,
      ogImage: imageSrc(p.seo.og_image?.url) || null,
    },
    sections: (p.sections ?? []).map(mapSection).sort((a, b) => a.order - b.order),
  };
}

const mapMenu = (items: ApiMenuItem[] = []): NavItem[] =>
  items.map((i) => ({ label: i.label, href: i.url, newTab: i.open_in_new_tab, children: mapMenu(i.children ?? []) }));

function str(v: ApiSettings[string]): string | null {
  return typeof v === "string" && v.trim() ? v : null;
}
function mediaUrl(v: ApiSettings[string]): string | null {
  return v && typeof v === "object" && "url" in v ? imageSrc(v.url) : null;
}

function mapSettings(s: ApiSettings): SiteSettings {
  const social = (
    [
      ["Instagram", s.social_instagram],
      ["Facebook", s.social_facebook],
      ["YouTube", s.social_youtube],
      ["X", s.social_x],
    ] as const
  )
    .map(([label, v]) => ({ label, href: str(v) ?? "" }))
    .filter((x) => x.href);
  return {
    siteName: str(s.site_name) ?? "Devalok Sculptures",
    tagline: str(s.tagline) ?? "",
    description: str(s.site_description) ?? "",
    logo: mediaUrl(s.logo),
    favicon: mediaUrl(s.favicon),
    email: str(s.contact_email),
    phone: str(s.contact_phone),
    whatsapp: str(s.whatsapp_number),
    addressLines: [s.address_line_1, s.address_line_2, s.address_line_3].map(str).filter((x): x is string => !!x),
    mapUrl: str(s.map_url),
    social,
    footerText: str(s.footer_text),
    vision: str(s.vision),
    mission: str(s.mission),
    seoDefaultTitle: str(s.seo_default_title),
    seoTitleTemplate: str(s.seo_title_template),
    seoDefaultDescription: str(s.seo_default_description),
    seoDefaultOgImage: mediaUrl(s.seo_default_og),
  };
}

export const EMPTY_SITE: SiteData = {
  ok: false,
  settings: mapSettings({}),
  menus: { header: [], footer: [] },
  categories: [],
  sculptures: [],
  pages: {},
  reviews: [],
};

/**
 * Everything the public site renders, from one cached request to
 * GET /api/v1/site. Cached for a few minutes and tagged "cms", so the admin
 * panel can refresh it immediately after a save (see app/admin/actions.ts).
 */
export async function getSiteData(): Promise<SiteData> {
  "use cache";
  // Browsers may reuse data for 30 s; the server re-checks every 30 s, and Laravel
  // triggers an immediate refresh after each admin save (app/api/revalidate).
  cacheLife({ stale: 30, revalidate: 30, expire: 3600 });
  cacheTag("cms");

  // No API configured (Vercel demo): serve the bundled snapshot of the CMS content.
  if (!API_CONFIGURED) return mapSiteData(snapshot.data as unknown as ApiSiteData);

  try {
    const res = await fetch(`${API_BASE_URL}/site`, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`CMS responded ${res.status}`);
    const { data } = (await res.json()) as { data: ApiSiteData };
    return mapSiteData(data);
  } catch (err) {
    console.error("[cms] Could not load site data, using the bundled snapshot:", err instanceof Error ? err.message : err);
    return mapSiteData(snapshot.data as unknown as ApiSiteData);
  }
}

type ApiSiteData = { settings: ApiSettings; menus: { header: ApiMenuItem[]; footer: ApiMenuItem[] }; categories: ApiCategory[]; sculptures: ApiSculpture[]; pages: Record<string, ApiPage>; reviews?: ApiReview[] };

function mapSiteData(data: ApiSiteData): SiteData {
  return {
    ok: true,
    settings: mapSettings(data.settings ?? {}),
    menus: { header: mapMenu(data.menus?.header), footer: mapMenu(data.menus?.footer) },
    categories: (data.categories ?? []).map(mapCategory).sort((a, b) => a.order - b.order),
    sculptures: (data.sculptures ?? []).map(mapSculpture),
    reviews: (data.reviews ?? []).map((r) => ({ id: r.id, name: r.name, location: r.location, rating: Math.max(1, Math.min(5, r.rating)), content: r.content, avatar: imageSrc(r.avatar?.url) || null, sample: r.is_sample })),
    pages: Object.fromEntries(Object.values(data.pages ?? {}).map((p) => [p.slug, mapPage(p)])),
  };
}
