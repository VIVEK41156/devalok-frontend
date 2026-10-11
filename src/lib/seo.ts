import "server-only";
import type { Metadata } from "next";
import { getSite } from "./site";

/** Per-page metadata from the CMS (Website Pages → SEO), falling back to site defaults. */
export async function pageMetadata(slug: string, opts: { absoluteTitle?: boolean } = {}): Promise<Metadata> {
  const site = await getSite();
  const page = site.page(slug);
  const s = site.data.settings;
  const title = page?.seo.title || (slug === "home" ? s.seoDefaultTitle : page?.title) || s.siteName;
  const description = page?.seo.description || page?.intro || s.seoDefaultDescription || s.description;
  const ogImage = page?.seo.ogImage || page?.featuredImage?.src || s.seoDefaultOgImage || undefined;
  return {
    title: opts.absoluteTitle ? { absolute: title } : title,
    description,
    alternates: page?.seo.canonical ? { canonical: page.seo.canonical } : undefined,
    openGraph: {
      title: page?.seo.ogTitle || title,
      description: page?.seo.ogDescription || description,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
  };
}
