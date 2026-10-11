// Pure helpers over the CMS snapshot (SiteData). Used both on the server
// (via getSite() in lib/site.ts) and in client components (via useSite()).

import type { Category, PageSection, Sculpture, SiteData, SitePage } from "@/data/types";

export type Catalog = ReturnType<typeof createCatalog>;

export function createCatalog(data: SiteData) {
  const bySlug = new Map(data.sculptures.map((s) => [s.slug, s]));
  const catBySlug = new Map(data.categories.map((c) => [c.id, c]));
  const ordered = [...data.sculptures].sort((a, b) => a.order - b.order);

  const getSculptures = (category?: string): Sculpture[] => (category ? ordered.filter((s) => s.category === category) : ordered);

  return {
    data,
    getCategories: (): Category[] => data.categories,
    getCategory: (id: string): Category | undefined => catBySlug.get(id),
    isCategoryId: (value: string | null | undefined): value is string => !!value && catBySlug.has(value),
    categoryName: (id: string): string => catBySlug.get(id)?.shortName ?? id,
    getSculptures,
    getFeaturedSculptures: (): Sculpture[] => {
      const featured = ordered.filter((s) => s.featured);
      return featured.length ? featured : ordered;
    },
    getSculptureBySlug: (slug: string): Sculpture | undefined => bySlug.get(slug),
    /** Same category first, then same subject, excluding the piece itself. */
    getRelatedSculptures: (sculpture: Sculpture, limit = 4): Sculpture[] => {
      const score = (s: Sculpture) => (s.category === sculpture.category ? 2 : 0) + (s.deity && s.deity === sculpture.deity ? 1 : 0);
      return ordered
        .filter((s) => s.id !== sculpture.id)
        .sort((a, b) => score(b) - score(a) || a.order - b.order)
        .slice(0, limit);
    },
    page: (slug: string): SitePage | undefined => data.pages[slug],
    /** A visible section of a page, or undefined when hidden/missing. */
    section: (page: string, key: string): PageSection | undefined => data.pages[page]?.sections.find((s) => s.key === key && s.visible),
  };
}

/** Banner-cropped photos are small; the viewer should not upscale them too far. */
export function isLowResolution(s: Sculpture): boolean {
  return s.image.height < 900;
}
