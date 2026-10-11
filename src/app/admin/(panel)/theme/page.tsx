"use client";

import { useState } from "react";
import { AlertTriangle, ExternalLink, Palette, RotateCcw, Save } from "lucide-react";
import { api } from "@/lib/admin-api";
import { refreshPublicSite } from "@/app/admin/actions";
import { useAuth } from "@/components/admin/AuthProvider";
import { Badge, Button, Card, EmptyState, ErrorState, LoadingState, PageHeader, useConfirm, useToast } from "@/components/admin/ui";
import { saveErrors, useApi } from "@/components/admin/useApi";
import { PALETTE, SECTIONS, contrast, isHex, type ThemeColors } from "@/lib/theme";

const GROUPS = Array.from(new Set(SECTIONS.map((s) => s.group)));

/** Colour picker + hex input + reset. */
function ColorInput({ label, value, fallback, onChange, error }: { label: string; value: string | undefined; fallback: string; onChange: (v: string | undefined) => void; error?: string }) {
  const [text, setText] = useState(value ?? "");
  const [lastValue, setLastValue] = useState(value);
  if (lastValue !== value) {
    setLastValue(value);
    setText(value ?? "");
  }
  const effective = value ?? fallback;
  return (
    <div className="flex items-center gap-2">
      <label className="relative h-10 w-10 shrink-0 cursor-pointer overflow-hidden rounded-lg ring-1 ring-plum/20" style={{ background: effective }} title={`Pick ${label}`}>
        <span className="sr-only">Pick {label}</span>
        <input type="color" value={effective.length === 4 ? effective.replace(/^#(.)(.)(.)$/, "#$1$1$2$2$3$3") : effective} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
      </label>
      <input
        aria-label={`${label} hex value`}
        value={text}
        placeholder={fallback}
        onChange={(e) => {
          const v = e.target.value.trim();
          setText(v);
          if (v === "") onChange(undefined);
          else if (isHex(v)) onChange(v.toLowerCase());
        }}
        className={`w-24 rounded-md border bg-white px-2 py-2 font-mono text-xs uppercase text-plum outline-none focus:border-gold focus:ring-2 focus:ring-gold/25 ${error || (text && !isHex(text)) ? "border-red-400" : "border-plum/20"}`}
      />
      <button
        type="button"
        onClick={() => onChange(undefined)}
        disabled={value === undefined}
        title="Reset to the design default"
        aria-label={`Reset ${label} to default`}
        className="rounded-md p-2 text-plum/50 transition hover:bg-lavender hover:text-plum disabled:opacity-30"
      >
        <RotateCcw size={14} />
      </button>
    </div>
  );
}

function ThemeEditor({ initial, onSaved }: { initial: ThemeColors; onSaved: (t: ThemeColors) => void }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [palette, setPalette] = useState<Record<string, string>>({ ...initial.palette });
  const [sections, setSections] = useState<Record<string, string>>({ ...initial.sections });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const pal = (key: string) => palette[key] ?? PALETTE.find((p) => p.key === key)!.default;
  const setOne = (setter: typeof setPalette) => (key: string, v: string | undefined) =>
    setter((m) => {
      const next = { ...m };
      if (v === undefined) delete next[key];
      else next[key] = v;
      return next;
    });
  const setPal = setOne(setPalette);
  const setSec = setOne(setSections);
  const lightText = pal("ivory");
  const darkText = pal("plum");
  const dirty = JSON.stringify(palette) !== JSON.stringify(initial.palette) || JSON.stringify(sections) !== JSON.stringify(initial.sections);

  const save = async () => {
    setSaving(true);
    try {
      const res = await api.put<{ data: ThemeColors }>("/admin/theme", { palette, sections });
      await refreshPublicSite();
      setErrors({});
      onSaved(res.data);
      toast({ tone: "success", message: "Colours saved. The website is updated." });
    } catch (e) {
      const { fields, message } = saveErrors(e);
      setErrors(Object.fromEntries(Object.entries(fields).map(([k, v]) => [k.replace(/^(palette|sections)\./, ""), v])));
      toast({ tone: "error", message });
    } finally {
      setSaving(false);
    }
  };

  const resetAll = async () => {
    if (!(await confirm({ title: "Reset all colours?", message: "Every palette colour and section background returns to the original design. Click Save to apply.", confirmLabel: "Reset" }))) return;
    setPalette({});
    setSections({});
  };

  return (
    <>
      <div className="sticky top-16 z-30 -mx-4 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-gold/20 bg-parchment/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <p className="text-sm text-mist">{dirty ? <Badge tone="warning">Unsaved changes</Badge> : "All changes saved"}</p>
        <div className="flex flex-wrap gap-2">
          <a href="/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-md border border-plum/20 bg-white px-4 py-2.5 text-sm font-semibold text-plum hover:border-gold">
            View website <ExternalLink size={14} />
          </a>
          <Button variant="outline" icon={<RotateCcw size={16} />} onClick={() => void resetAll()}>
            Reset all
          </Button>
          <Button loading={saving} disabled={!dirty} icon={<Save size={16} />} onClick={() => void save()}>
            Save colours
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card title="Brand palette">
            <p className="mb-5 text-sm text-mist">These colours are used for text, buttons, lines and details across the whole website. Section backgrounds below can also be picked from them.</p>
            <ul className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
              {PALETTE.map((p) => (
                <li key={p.key} className="flex items-center justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-plum">
                      {p.label} {palette[p.key] && <span className="text-xs font-normal text-gold-deep">· custom</span>}
                    </span>
                    <span className="block truncate text-xs text-mist">{p.hint}</span>
                    {errors[p.key] && <span className="block text-xs text-red-700">{errors[p.key]}</span>}
                  </span>
                  <ColorInput label={p.label} value={palette[p.key]} fallback={p.default} onChange={(v) => setPal(p.key, v)} error={errors[p.key]} />
                </li>
              ))}
            </ul>
          </Card>

          {GROUPS.map((group) => (
            <Card key={group} title={`Backgrounds · ${group}`} padded={false}>
              <ul className="divide-y divide-gold/10">
                {SECTIONS.filter((s) => s.group === group).map((s) => {
                  const value = sections[s.key];
                  const effective = value ?? s.default;
                  const text = s.text === "light" ? lightText : darkText;
                  const ratio = contrast(effective, text);
                  return (
                    <li key={s.key} className="flex flex-wrap items-center gap-4 px-5 py-4">
                      <span className="flex h-12 w-20 shrink-0 items-center justify-center rounded-lg font-display text-lg ring-1 ring-plum/10" style={{ background: effective, color: text }} aria-hidden>
                        Aa
                      </span>
                      <span className="min-w-[180px] flex-1">
                        <span className="block text-sm font-semibold text-plum">
                          {s.label} {value && <span className="text-xs font-normal text-gold-deep">· custom</span>}
                        </span>
                        <span className="mt-1.5 flex flex-wrap gap-1.5" role="group" aria-label={`Pick ${s.label} from the palette`}>
                          {PALETTE.map((p) => (
                            <button
                              key={p.key}
                              type="button"
                              title={p.label}
                              aria-label={`Use ${p.label}`}
                              onClick={() => setSec(s.key, pal(p.key))}
                              className={`h-5 w-5 rounded-full ring-1 ring-plum/15 transition hover:scale-125 ${effective.toLowerCase() === pal(p.key).toLowerCase() ? "ring-2 ring-gold ring-offset-1" : ""}`}
                              style={{ background: pal(p.key) }}
                            />
                          ))}
                        </span>
                        {ratio < 3 && (
                          <span className="mt-1.5 flex items-center gap-1 text-xs text-amber-700">
                            <AlertTriangle size={12} /> Text may be hard to read on this colour ({ratio.toFixed(1)}:1). This section uses {s.text === "light" ? "light" : "dark"} text.
                          </span>
                        )}
                        {errors[s.key] && <span className="block text-xs text-red-700">{errors[s.key]}</span>}
                      </span>
                      <ColorInput label={s.label} value={value} fallback={s.default} onChange={(v) => setSec(s.key, v)} error={errors[s.key]} />
                    </li>
                  );
                })}
              </ul>
            </Card>
          ))}
        </div>

        {/* Page map: every section in order, in its chosen colour */}
        <aside className="xl:sticky xl:top-36 xl:self-start">
          <Card title="Page map">
            <p className="mb-3 text-xs text-mist">How the home page reads from top to bottom.</p>
            <ol className="overflow-hidden rounded-lg ring-1 ring-plum/15">
              {SECTIONS.filter((s) => s.group === "Every page" || s.group === "Home page")
                .sort((a, b) => {
                  const order = ["topbar", "header", "home_hero", "home_intro", "home_collections", "home_hall", "home_signature", "home_craft", "home_gallery", "values", "home_reviews", "cta", "footer"];
                  return order.indexOf(a.key) - order.indexOf(b.key);
                })
                .map((s) => (
                  <li
                    key={s.key}
                    className="flex items-center px-3 text-[10px] font-semibold uppercase tracking-[0.14em]"
                    style={{ background: sections[s.key] ?? s.default, color: s.text === "light" ? lightText : darkText, height: s.key === "topbar" ? 18 : s.key === "home_hero" || s.key === "home_hall" ? 44 : 28 }}
                  >
                    {s.label.replace(/ \(.*\)/, "")}
                  </li>
                ))}
            </ol>
          </Card>
        </aside>
      </div>
    </>
  );
}

export default function ThemePage() {
  const { user } = useAuth();
  const res = useApi(() => (user?.role === "admin" ? api.get<{ data: ThemeColors }>("/admin/theme").then((r) => r.data) : Promise.resolve(null)), [user?.role]);

  if (user?.role !== "admin") {
    return (
      <>
        <PageHeader title="Theme & Colors" />
        <EmptyState title="Administrators only" description="Ask an administrator to change the website colours." />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Theme & Colors"
        description={
          <span className="inline-flex items-center gap-1.5">
            <Palette size={14} /> Change the brand palette and the background of every section, from the top bar to the footer. Leave a colour empty to keep the original design.
          </span>
        }
      />
      {res.loading && !res.data ? <LoadingState /> : res.error ? <ErrorState message={res.error} onRetry={res.reload} /> : res.data ? <ThemeEditor key={JSON.stringify(res.data)} initial={res.data} onSaved={(t) => res.setData(t)} /> : null}
    </>
  );
}
