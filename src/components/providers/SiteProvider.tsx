"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { SiteData } from "@/data/types";
import { createCatalog, type Catalog } from "@/lib/catalog";

const SiteContext = createContext<Catalog | null>(null);

/** Client components read the CMS snapshot that the (site) layout fetched on the server. */
export function useSite(): Catalog {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error("useSite must be used inside <SiteProvider>");
  return ctx;
}

export default function SiteProvider({ data, children }: { data: SiteData; children: ReactNode }) {
  const catalog = useMemo(() => createCatalog(data), [data]);
  return <SiteContext.Provider value={catalog}>{children}</SiteContext.Provider>;
}
