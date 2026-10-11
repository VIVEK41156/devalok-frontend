import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { getSiteData } from "@/lib/cms";
import "./globals.css";

// Self-hosted (latin subset, variable weights) so builds never depend on Google Fonts.
const display = localFont({
  variable: "--font-cormorant",
  src: [
    { path: "../fonts/cormorant-garamond.woff2", weight: "300 700", style: "normal" },
    { path: "../fonts/cormorant-garamond-italic.woff2", weight: "300 700", style: "italic" },
  ],
  display: "swap",
});

const sans = localFont({
  variable: "--font-manrope",
  src: [{ path: "../fonts/manrope.woff2", weight: "200 800", style: "normal" }],
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://devaloksculptures.in";

/** Global SEO defaults come from Site Settings in the CMS. */
export async function generateMetadata(): Promise<Metadata> {
  const { settings: s } = await getSiteData();
  const template = s.seoTitleTemplate?.includes("%s") ? s.seoTitleTemplate : `%s | ${s.siteName}`;
  const description = s.seoDefaultDescription ?? s.description;
  const og = s.seoDefaultOgImage ?? "/images/sculptures/kanyaka-parameshwari-stone.jpg";
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: s.seoDefaultTitle ?? s.siteName, template },
    description,
    openGraph: { type: "website", siteName: s.siteName, title: s.seoDefaultTitle ?? s.siteName, description, images: [{ url: og }] },
    twitter: { card: "summary_large_image" },
    icons: { icon: s.favicon ?? "/images/brand/om.png" },
  };
}

export const viewport: Viewport = {
  themeColor: "#30233b",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
