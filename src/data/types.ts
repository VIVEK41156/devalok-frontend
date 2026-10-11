// Frontend shapes. src/lib/cms.ts maps the Laravel API (/api/v1) into these,
// so components stay independent of the wire format.

/** Category slug, e.g. "stone". Categories are managed in the CMS. */
export type CategoryId = string;

export interface Category {
  /** The slug; used for filtering and URLs. */
  id: CategoryId;
  dbId: number;
  slug: string;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  coverImage: string;
  order: number;
  count: number;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

export interface ImageAsset {
  src: string;
  width: number;
  height: number;
  alt: string;
}

/** A framed close-up of the sculpture's own photograph (CSS zoom, no extra file). */
export interface DetailView {
  label: string;
  /** Focal point in percent of the image. */
  x: number;
  y: number;
  zoom: number;
}

export interface Sculpture {
  id: string;
  slug: string;
  name: string;
  category: CategoryId;
  deity: string;
  finish: string;
  summary: string;
  description: string;
  image: ImageAsset;
  /** Transparent-background version for staged presentation, when available. */
  cutout?: Omit<ImageAsset, "alt">;
  /** Additional photographs managed in the CMS gallery (excluding the cover). */
  gallery: ImageAsset[];
  details: DetailView[];
  dimensions?: string | null;
  weight?: string | null;
  craftsmanship?: string | null;
  /** Set when the photo is an openly licensed stand-in, not the client's own work. */
  reference?: { credit: string; license: string; url: string };
  featured: boolean;
  order: number;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

export interface NavItem {
  label: string;
  href: string;
  newTab?: boolean;
  children?: NavItem[];
}

export interface PageSection {
  key: string;
  eyebrow?: string | null;
  heading?: string | null;
  headingAccent?: string | null;
  description?: string | null;
  image?: ImageAsset | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  visible: boolean;
  order: number;
}

export interface SitePage {
  slug: string;
  title: string;
  intro?: string | null;
  content?: string | null;
  featuredImage?: ImageAsset | null;
  seo: { title?: string | null; description?: string | null; canonical?: string | null; ogTitle?: string | null; ogDescription?: string | null; ogImage?: string | null };
  sections: PageSection[];
}

export interface SiteSettings {
  siteName: string;
  tagline: string;
  description: string;
  logo?: string | null;
  favicon?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  addressLines: string[];
  mapUrl?: string | null;
  social: { label: string; href: string }[];
  footerText?: string | null;
  vision?: string | null;
  mission?: string | null;
  seoDefaultTitle?: string | null;
  seoTitleTemplate?: string | null;
  seoDefaultDescription?: string | null;
  seoDefaultOgImage?: string | null;
}

export interface Review {
  id: number;
  name: string;
  location?: string | null;
  rating: number;
  content: string;
  avatar?: string | null;
  /** Placeholder review added for the demo; shown with a small "Sample" tag. */
  sample: boolean;
}

export interface SiteData {
  /** false when the CMS could not be reached; pages show an unobtrusive empty state. */
  ok: boolean;
  settings: SiteSettings;
  menus: { header: NavItem[]; footer: NavItem[] };
  categories: Category[];
  sculptures: Sculpture[];
  pages: Record<string, SitePage>;
  reviews: Review[];
}
