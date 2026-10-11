import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ViewerProvider from "@/components/sculpture/ViewerProvider";
import SiteProvider from "@/components/providers/SiteProvider";
import { getSiteData } from "@/lib/cms";
import { themeCss } from "@/lib/theme";

/** Public website shell. Content comes from the Laravel CMS (cached, tag "cms"). */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const data = await getSiteData();
  return (
    <SiteProvider data={data}>
      {/* Colours from Admin → Theme & Colors; themeCss only emits validated hex values. */}
      <style dangerouslySetInnerHTML={{ __html: themeCss(data.settings.theme) }} />
      <a href="#main" className="fixed left-4 top-4 z-[200] -translate-y-24 bg-gold px-4 py-2 text-sm font-semibold text-plum-deep focus:translate-y-0">
        Skip to content
      </a>
      <ViewerProvider>
        <Navbar />
        <main id="main">
          {!data.ok && (
            <p role="status" className="fixed bottom-4 left-1/2 z-[60] -translate-x-1/2 bg-plum-deep/90 px-4 py-2 text-xs text-ivory/80 ring-1 ring-gold/40">
              Content is temporarily unavailable. Please refresh in a moment.
            </p>
          )}
          {children}
        </main>
        <Footer />
      </ViewerProvider>
    </SiteProvider>
  );
}
