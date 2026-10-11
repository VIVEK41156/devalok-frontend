"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence } from "framer-motion";
import { useSite } from "@/components/providers/SiteProvider";
import type { Sculpture } from "@/data/types";
import SculptureViewer from "./SculptureViewer";

interface ViewerContextValue {
  /** Open a sculpture; `sequence` is the list prev/next piece buttons walk through. */
  openSculpture: (slug: string, sequence?: string[]) => void;
}

const ViewerContext = createContext<ViewerContextValue | null>(null);

export function useSculptureViewer() {
  const ctx = useContext(ViewerContext);
  if (!ctx) throw new Error("useSculptureViewer must be used inside <ViewerProvider>");
  return ctx;
}

export default function ViewerProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<Sculpture | null>(null);
  const [sequence, setSequence] = useState<string[]>([]);
  const { getSculptureBySlug, getSculptures } = useSite();

  const openSculpture = useCallback((slug: string, seq?: string[]) => {
    const found = getSculptureBySlug(slug);
    if (!found) return;
    setSequence(seq && seq.length ? seq : getSculptures().map((s) => s.slug));
    setCurrent(found);
  }, [getSculptureBySlug, getSculptures]);

  const step = useCallback(
    (dir: 1 | -1) => {
      if (!current || sequence.length < 2) return;
      const i = sequence.indexOf(current.slug);
      const next = sequence[(i + dir + sequence.length) % sequence.length];
      const found = getSculptureBySlug(next);
      if (found) setCurrent(found);
    },
    [current, sequence, getSculptureBySlug],
  );

  const value = useMemo(() => ({ openSculpture }), [openSculpture]);

  return (
    <ViewerContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {current && (
          <SculptureViewer
            key="viewer"
            sculpture={current}
            onClose={() => setCurrent(null)}
            onPrevPiece={() => step(-1)}
            onNextPiece={() => step(1)}
            onSelect={(slug) => openSculpture(slug, sequence.includes(slug) ? sequence : undefined)}
            position={{ index: Math.max(0, sequence.indexOf(current.slug)), total: sequence.length }}
          />
        )}
      </AnimatePresence>
    </ViewerContext.Provider>
  );
}
