"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Eye, EyeOff, Save } from "lucide-react";
import { api, type Page, type PageSection } from "@/lib/admin-api";
import { refreshPublicSite } from "@/app/admin/actions";
import { Badge, Button, Card, TextArea, TextField, Toggle, useToast } from "./ui";
import { ImageField } from "./MediaPicker";
import { saveErrors } from "./useApi";

type Draft = Omit<PageSection, "id" | "key" | "label" | "sort_order">;

const toDraft = (s: PageSection): Draft => ({
  eyebrow: s.eyebrow,
  heading: s.heading,
  heading_accent: s.heading_accent,
  description: s.description,
  image: s.image,
  media_id: s.media_id,
  cta_label: s.cta_label,
  cta_url: s.cta_url,
  is_visible: s.is_visible,
});

function SectionRow({ page, section, index, total, onMove, onSaved }: { page: Page; section: PageSection; index: number; total: number; onMove: (d: -1 | 1) => void; onSaved: (s: PageSection) => void }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [d, setD] = useState<Draft>(() => toDraft(section));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));

  const save = async (patch?: Partial<Draft>) => {
    const body = { ...d, ...patch };
    setSaving(true);
    try {
      const res = await api.put<{ data: PageSection }>(`/admin/pages/${page.id}/sections/${section.id}`, {
        eyebrow: body.eyebrow || null,
        heading: body.heading || null,
        heading_accent: body.heading_accent || null,
        description: body.description || null,
        media_id: body.image?.id ?? null,
        cta_label: body.cta_label || null,
        cta_url: body.cta_url || null,
        is_visible: body.is_visible,
      });
      await refreshPublicSite();
      setD(toDraft(res.data));
      setErrors({});
      onSaved(res.data);
      toast({ tone: "success", message: `“${section.label ?? section.key}” saved.` });
    } catch (e) {
      const { fields, message } = saveErrors(e);
      setErrors(fields);
      setOpen(true);
      toast({ tone: "error", message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <li className="rounded-lg border border-gold/20 bg-white">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="flex flex-col">
          <Button variant="ghost" className="px-1.5 py-0.5" aria-label="Move up" disabled={index === 0} onClick={() => onMove(-1)} icon={<ArrowUp size={13} />} />
          <Button variant="ghost" className="px-1.5 py-0.5" aria-label="Move down" disabled={index === total - 1} onClick={() => onMove(1)} icon={<ArrowDown size={13} />} />
        </div>
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-plum">{section.label ?? section.key}</span>
            <span className="block truncate text-xs text-mist">
              {[d.heading, d.heading_accent].filter(Boolean).join(" ") || "No heading"} · key: {section.key}
            </span>
          </span>
          {d.is_visible ? <Badge tone="success">Visible</Badge> : <Badge>Hidden</Badge>}
          <ChevronDown size={16} className={`text-mist transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        <Button
          variant="ghost"
          aria-label={d.is_visible ? "Hide section" : "Show section"}
          title={d.is_visible ? "Hide" : "Show"}
          icon={d.is_visible ? <EyeOff size={16} /> : <Eye size={16} />}
          onClick={() => {
            const v = !d.is_visible;
            set("is_visible", v);
            void save({ is_visible: v });
          }}
        />
      </div>
      {open && (
        <div className="grid gap-4 border-t border-gold/15 p-4 md:grid-cols-2">
          <TextField label="Eyebrow / subtitle" maxLength={120} value={d.eyebrow ?? ""} onChange={(e) => set("eyebrow", e.target.value)} error={errors.eyebrow} />
          <div />
          <TextField label="Heading" maxLength={200} value={d.heading ?? ""} onChange={(e) => set("heading", e.target.value)} error={errors.heading} />
          <TextField label="Heading accent (italic gold)" maxLength={200} value={d.heading_accent ?? ""} onChange={(e) => set("heading_accent", e.target.value)} hint="Shown after the heading in italic gold." error={errors.heading_accent} />
          <div className="md:col-span-2">
            <TextArea label="Description" maxLength={3000} rows={3} value={d.description ?? ""} onChange={(e) => set("description", e.target.value)} error={errors.description} hint="Plain text only." />
          </div>
          <TextField label="Button label" maxLength={60} value={d.cta_label ?? ""} onChange={(e) => set("cta_label", e.target.value)} error={errors.cta_label} />
          <TextField label="Button link" maxLength={500} value={d.cta_url ?? ""} onChange={(e) => set("cta_url", e.target.value)} error={errors.cta_url} hint="A site path like /gallery, or a full https:// link." />
          <ImageField label="Image (optional)" media={d.image} onChange={(m) => set("image", m)} hint="Used by the Introduction (main photo) and Enquiry banner sections. Leave empty to keep the designed image." />
          <div className="flex flex-col justify-between gap-4">
            <Toggle label="Visible on the website" checked={d.is_visible} onChange={(v) => set("is_visible", v)} />
            <Button loading={saving} icon={<Save size={16} />} onClick={() => void save()}>
              Save section
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}

export default function SectionsEditor({ page, onChange }: { page: Page; onChange?: () => void }) {
  const toast = useToast();
  const [sections, setSections] = useState<PageSection[]>(() => [...(page.sections ?? [])].sort((a, b) => a.sort_order - b.sort_order));

  const move = async (i: number, d: -1 | 1) => {
    const next = [...sections];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setSections(next);
    try {
      await api.post(`/admin/pages/${page.id}/sections/reorder`, { ids: next.map((s) => s.id) });
      await refreshPublicSite();
      onChange?.();
    } catch (e) {
      setSections(sections);
      toast({ tone: "error", message: saveErrors(e).message });
    }
  };

  if (!sections.length) return null;
  return (
    <Card title="Sections" padded>
      <p className="mb-4 text-sm text-mist">
        Each section keeps the website&rsquo;s cinematic layout and animations; only its content, visibility and order are edited here.
        {page.slug === "home" && " Reordering changes the order of homepage sections."}
      </p>
      <ul className="space-y-3">
        {sections.map((s, i) => (
          <SectionRow
            key={s.id}
            page={page}
            section={s}
            index={i}
            total={sections.length}
            onMove={(d) => void move(i, d)}
            onSaved={(saved) => setSections((all) => all.map((x) => (x.id === saved.id ? saved : x)))}
          />
        ))}
      </ul>
    </Card>
  );
}
