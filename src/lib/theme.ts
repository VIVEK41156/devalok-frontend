// Theme colours managed in Admin → Theme & Colors.
// The website turns the saved values into CSS (see themeCss) — only validated
// hex colours are ever written, so the stylesheet cannot be tampered with.

export interface ThemeColors {
  palette: Record<string, string>;
  sections: Record<string, string>;
}

/** Brand palette tokens (Tailwind `--color-*` variables used across the site). */
export const PALETTE: { key: string; label: string; hint: string; default: string }[] = [
  { key: "lavender", label: "Lavender", hint: "Soft section backgrounds, top bar", default: "#e9ddf8" },
  { key: "lilac", label: "Light purple", hint: "Accents and soft text on dark", default: "#d9c5f0" },
  { key: "gold", label: "Champagne gold", hint: "Buttons, lines, stars, highlights", default: "#c8a45d" },
  { key: "gold-deep", label: "Deep gold", hint: "Gold text on light backgrounds", default: "#a8853f" },
  { key: "gold-soft", label: "Soft gold", hint: "Gold text on dark backgrounds", default: "#e6d3a3" },
  { key: "ivory", label: "Warm ivory", hint: "Light backgrounds, light text", default: "#faf7f0" },
  { key: "parchment", label: "Parchment", hint: "Alternate light background", default: "#f3ede1" },
  { key: "plum", label: "Deep plum", hint: "Headings, dark sections, buttons", default: "#30233b" },
  { key: "plum-deep", label: "Darkest plum", hint: "Header, footer, darkest areas", default: "#1f1627" },
  { key: "plum-soft", label: "Soft plum", hint: "Hover and secondary dark tones", default: "#4a3858" },
  { key: "mist", label: "Muted lavender-grey", hint: "Secondary text", default: "#8c7f99" },
  { key: "silver", label: "Silver", hint: "Metallic accent; also a section background option", default: "#c4c4cc" },
];

export type SectionStyle = "solid" | "glow";

/**
 * Every recolourable area of the website, top to bottom.
 * text: which text colour the section uses (for the contrast warning in the admin).
 * style "glow" keeps the cinematic radial lighting, built from the chosen colour.
 */
export const SECTIONS: { key: string; label: string; group: string; default: string; text: "light" | "dark"; style: SectionStyle }[] = [
  { key: "topbar", label: "Top bar (collection badges)", group: "Every page", default: "#e9ddf8", text: "dark", style: "solid" },
  { key: "header", label: "Header (after scrolling)", group: "Every page", default: "#1f1627", text: "light", style: "solid" },
  { key: "cta", label: "Enquiry banner", group: "Every page", default: "#30233b", text: "light", style: "solid" },
  { key: "footer", label: "Footer", group: "Every page", default: "#1f1627", text: "light", style: "solid" },

  { key: "home_hero", label: "Hero", group: "Home page", default: "#30233b", text: "light", style: "glow" },
  { key: "home_intro", label: "Brand introduction", group: "Home page", default: "#faf7f0", text: "dark", style: "solid" },
  { key: "home_collections", label: "Collections", group: "Home page", default: "#e9ddf8", text: "dark", style: "solid" },
  { key: "home_hall", label: "Hall of Devotion (3D)", group: "Home page", default: "#30233b", text: "light", style: "glow" },
  { key: "home_signature", label: "Signature sculptures", group: "Home page", default: "#faf7f0", text: "dark", style: "solid" },
  { key: "home_craft", label: "Art & craft story", group: "Home page", default: "#30233b", text: "light", style: "solid" },
  { key: "home_gallery", label: "Gallery preview", group: "Home page", default: "#f3ede1", text: "dark", style: "solid" },
  { key: "values", label: "Our values (Home & About)", group: "Home page", default: "#e9ddf8", text: "dark", style: "solid" },
  { key: "home_reviews", label: "Reviews", group: "Home page", default: "#3d2b52", text: "light", style: "glow" },

  { key: "page_header", label: "Page headers (About, Products, Gallery, Contact)", group: "Inner pages", default: "#30233b", text: "light", style: "glow" },

  { key: "products_tabs", label: "Collection tab bar", group: "Products page", default: "#faf7f0", text: "dark", style: "solid" },
  { key: "products_a", label: "Collections 1 & 3", group: "Products page", default: "#faf7f0", text: "dark", style: "solid" },
  { key: "products_b", label: "Collections 2 & 4", group: "Products page", default: "#e9ddf8", text: "dark", style: "solid" },

  { key: "gallery_spotlight", label: "Featured sculpture", group: "Gallery page", default: "#e9ddf8", text: "dark", style: "solid" },
  { key: "gallery_grid", label: "Full collection", group: "Gallery page", default: "#faf7f0", text: "dark", style: "solid" },

  { key: "about_philosophy", label: "Philosophy", group: "About page", default: "#faf7f0", text: "dark", style: "solid" },
  { key: "about_craft", label: "Workshop images", group: "About page", default: "#30233b", text: "light", style: "solid" },
  { key: "about_materials", label: "Materials list", group: "About page", default: "#faf7f0", text: "dark", style: "solid" },

  { key: "contact_section", label: "Contact section", group: "Contact page", default: "#faf7f0", text: "dark", style: "solid" },
  { key: "contact_panel", label: "Contact details panel", group: "Contact page", default: "#4b3366", text: "light", style: "glow" },
];

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
export const isHex = (v: unknown): v is string => typeof v === "string" && HEX.test(v);

/** Builds the stylesheet for the saved colours. Unknown keys / invalid values are ignored. */
export function themeCss(theme: ThemeColors | null | undefined): string {
  if (!theme) return "";
  const rules: string[] = [];
  const vars = PALETTE.filter((p) => isHex(theme.palette?.[p.key])).map((p) => `--color-${p.key}:${theme.palette[p.key]}`);
  if (vars.length) rules.push(`:root{${vars.join(";")}}`);
  for (const s of SECTIONS) {
    const c = theme.sections?.[s.key];
    if (!isHex(c)) continue;
    const sel = s.key === "header" ? `[data-bg="header"][data-solid="true"]` : `[data-bg="${s.key}"]`;
    const bg =
      s.style === "glow"
        ? `radial-gradient(ellipse at 60% 40%, color-mix(in oklab, ${c} 72%, white) 0%, ${c} 45%, color-mix(in oklab, ${c} 60%, black) 100%)`
        : s.key === "header"
          ? `color-mix(in oklab, ${c} 92%, transparent)`
          : c;
    rules.push(`${sel}{background:${bg} !important}`);
  }
  return rules.join("\n");
}

/** WCAG contrast ratio between two hex colours. */
export function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const h = hex.length === 4 ? hex.replace(/^#(.)(.)(.)$/, "#$1$1$2$2$3$3") : hex;
    const [r, g, bl] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}
