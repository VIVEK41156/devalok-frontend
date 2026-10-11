import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import { Mail, MapPin, Phone } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import PageHero from "@/components/ui/PageHero";
import RevealScope from "@/components/motion/RevealScope";
import ContactForm, { ContactFormFromParams } from "@/components/contact/ContactForm";
import { titleOf } from "@/components/ui/SectionTitle";
import { getSite } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("contact");
}

const ROW = "group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 transition hover:border-gold/60 hover:bg-white/[0.09]";
const DOT = "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold-soft ring-1 ring-gold/40 transition group-hover:bg-gold group-hover:text-plum-deep";

export default async function ContactPage() {
  const cms = await getSite();
  const page = cms.page("contact");
  const hero = cms.section("contact", "hero");
  const site = cms.data.settings;
  const whatsapp = site.whatsapp?.replace(/[^0-9]/g, "");

  return (
    <>
      <PageHero
        eyebrow={hero?.eyebrow ?? "Contact us"}
        title={titleOf(hero, { heading: page?.title ?? "Contact us" }, "text-gold-sheen")}
        intro={page?.intro}
        image={page?.featuredImage ? { src: page.featuredImage.src, alt: "" } : { src: "/images/cutouts/varaha-stone.webp", alt: "", cutout: true }}
      />

      <RevealScope as="section" className="grain relative overflow-hidden bg-ivory py-20 sm:py-28">
        <div aria-hidden className="pointer-events-none absolute -right-40 top-10 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle,rgba(217,197,240,0.55),transparent_65%)]" />
        <div className="relative mx-auto grid max-w-[1400px] items-stretch gap-8 px-5 sm:px-8 lg:grid-cols-12 lg:gap-10">
          {/* Violet info panel with sculpture */}
          <aside data-reveal="rise3d" aria-label="Contact details" className="relative isolate flex flex-col overflow-hidden rounded-3xl bg-[linear-gradient(160deg,#4b3366_0%,#30233b_55%,#1f1627_100%)] p-7 text-ivory shadow-[0_50px_90px_-50px_rgba(48,35,59,0.9)] sm:p-10 lg:col-span-5">
            <div aria-hidden className="absolute -right-24 -top-24 -z-10 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(217,197,240,0.35),transparent_65%)]" />
            <p className="eyebrow text-gold-soft">Reach us directly</p>
            <h2 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
              Visit the <em className="text-gold-sheen">workshop</em>
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-lilac/90">See the sculptures in person, or tell us what you have in mind and we&rsquo;ll guide you.</p>

            <div className="relative mx-auto mt-8 aspect-[4/5] w-full max-w-[280px]">
              <svg aria-hidden viewBox="0 0 300 400" preserveAspectRatio="none" className="absolute inset-0 h-full w-full text-gold/60" fill="none">
                <path d="M6 400 V150 C6 70 70 6 150 6 C230 6 294 70 294 150 V400" stroke="currentColor" vectorEffect="non-scaling-stroke" />
              </svg>
              <div className="absolute inset-[5%] overflow-hidden rounded-t-full bg-[radial-gradient(ellipse_at_50%_40%,#e9ddf8_0%,#b9a3d0_50%,#4a3858_100%)]">
                <Image
                  src={hero?.image?.src ?? "/images/cutouts/kanyaka-parameshwari-stone.webp"}
                  alt="Hand-carved sculpture from the Devalok workshop"
                  fill
                  sizes="280px"
                  className="object-contain object-bottom px-[10%] pt-[14%] drop-shadow-[0_25px_25px_rgba(0,0,0,0.5)]"
                />
              </div>
            </div>

            <ul className="mt-8 space-y-3">
              {site.phone && (
                <li>
                  <a href={`tel:${site.phone.replace(/[^0-9+]/g, "")}`} className={ROW}>
                    <span className={DOT}>
                      <Phone size={16} />
                    </span>
                    <span>
                      <span className="eyebrow block text-[9px] text-lilac/70">Call</span>
                      <span className="block font-display text-xl">{site.phone}</span>
                    </span>
                  </a>
                </li>
              )}
              {whatsapp && (
                <li>
                  <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className={ROW}>
                    <span className={DOT}>
                      <FaWhatsapp size={16} />
                    </span>
                    <span>
                      <span className="eyebrow block text-[9px] text-lilac/70">WhatsApp</span>
                      <span className="block font-display text-xl">{site.whatsapp}</span>
                    </span>
                  </a>
                </li>
              )}
              {site.email && (
                <li>
                  <a href={`mailto:${site.email}`} className={ROW}>
                    <span className={DOT}>
                      <Mail size={16} />
                    </span>
                    <span className="min-w-0">
                      <span className="eyebrow block text-[9px] text-lilac/70">Email</span>
                      <span className="block break-all font-display text-xl">{site.email}</span>
                    </span>
                  </a>
                </li>
              )}
              {site.addressLines.length > 0 && (
                <li>
                  <a href={site.mapUrl ?? "#"} target="_blank" rel="noopener noreferrer" className={ROW}>
                    <span className={DOT}>
                      <MapPin size={16} />
                    </span>
                    <span>
                      <span className="eyebrow block text-[9px] text-lilac/70">Visit</span>
                      <span className="block text-sm leading-snug text-ivory/90">{site.addressLines.join(", ")}</span>
                      {site.mapUrl && <span className="mt-1 block text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-soft">Open in Maps →</span>}
                    </span>
                  </a>
                </li>
              )}
            </ul>
          </aside>

          {/* Form */}
          <div data-reveal="rise3d" data-reveal-delay="0.12" className="lg:col-span-7">
            <Suspense fallback={<ContactForm />}>
              <ContactFormFromParams />
            </Suspense>
          </div>
        </div>
      </RevealScope>
    </>
  );
}
