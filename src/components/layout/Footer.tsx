import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { getSite } from "@/lib/site";
import BackToTop from "./BackToTop";

export default async function Footer() {
  const cms = await getSite();
  const site = cms.data.settings;
  const categories = cms.getCategories();
  const navItems = cms.data.menus.footer.length ? cms.data.menus.footer : cms.data.menus.header;
  return (
    <footer data-bg="footer" className="grain relative overflow-hidden bg-plum-deep text-ivory">
      <div aria-hidden className="pointer-events-none absolute -left-40 top-10 h-[480px] w-[480px] rounded-full border border-gold/10" />
      <div aria-hidden className="pointer-events-none absolute -bottom-60 right-[-10%] h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,rgba(217,197,240,0.12),transparent_65%)]" />

      <div className="relative mx-auto max-w-[1400px] px-5 pb-10 pt-20 sm:px-8">
        <div className="grid gap-14 lg:grid-cols-[1.3fr_1fr_1fr_1.3fr]">
          <div>
            <Image src={site.logo || "/images/brand/logo.png"} alt={site.siteName} width={120} height={141} className="h-28 w-auto" />
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-ivory/60">{site.description}</p>
            {site.social.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-4 text-xs uppercase tracking-[0.2em]">
                {site.social.map((x) => (
                  <li key={x.href}>
                    <a href={x.href} target="_blank" rel="noopener noreferrer" className="text-gold-soft hover:text-gold">
                      {x.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <p className="eyebrow text-gold">Explore</p>
            <ul className="mt-5 space-y-3 text-sm">
              {navItems.map((item, i) => (
                <li key={`${item.href}-${i}`}>
                  <Link href={item.href} className="text-ivory/75 transition hover:text-gold-soft">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="eyebrow text-gold">Collections</p>
            <ul className="mt-5 space-y-3 text-sm">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link href={`/gallery?category=${c.id}`} className="text-ivory/75 transition hover:text-gold-soft">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="eyebrow text-gold">Visit &amp; Write</p>
            <ul className="mt-5 space-y-4 text-sm text-ivory/75">
              {site.addressLines.length > 0 && (
                <li>
                  <a href={site.mapUrl ?? "#"} target="_blank" rel="noopener noreferrer" className="flex gap-3 transition hover:text-gold-soft">
                    <MapPin size={16} className="mt-0.5 shrink-0 text-gold" />
                    <span>
                      {site.addressLines.map((l) => (
                        <span key={l} className="block">
                          {l}
                        </span>
                      ))}
                    </span>
                  </a>
                </li>
              )}
              {site.phone && (
                <li>
                  <a href={`tel:${site.phone.replace(/[^0-9+]/g, "")}`} className="flex items-center gap-3 transition hover:text-gold-soft">
                    <Phone size={16} className="text-gold" /> {site.phone}
                  </a>
                </li>
              )}
              {site.email && (
                <li>
                  <a href={`mailto:${site.email}`} className="flex items-center gap-3 break-all transition hover:text-gold-soft">
                    <Mail size={16} className="shrink-0 text-gold" /> {site.email}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-6 border-t border-ivory/10 pt-8 sm:flex-row sm:items-center">
          <p className="text-xs tracking-wide text-ivory/45">
            {site.footerText ?? `© ${site.siteName}`}
          </p>
          <BackToTop />
        </div>
      </div>
    </footer>
  );
}
