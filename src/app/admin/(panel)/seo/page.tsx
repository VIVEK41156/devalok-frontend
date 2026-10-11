"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, FileText, Pencil, Settings } from "lucide-react";
import { api } from "@/lib/admin-api";
import { useApi } from "@/components/admin/useApi";
import { useAuth } from "@/components/admin/AuthProvider";
import { Badge, Card, EmptyState, ErrorState, LinkButton, LoadingState, PageHeader } from "@/components/admin/ui";

type SeoType = "page" | "category" | "sculpture";

/** Mirrors the SeoController overview rows. */
interface SeoRow {
  type: SeoType;
  id: number;
  name: string;
  path: string;
  seo_title: string | null;
  seo_description: string | null;
  missing: ("title" | "description")[];
}

const TITLE_MAX = 60;
const DESCRIPTION_MAX = 160;

const TYPE_LABEL: Record<SeoType, string> = { page: "Page", category: "Category", sculpture: "Sculpture" };
const TYPE_FILTERS: { value: SeoType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "page", label: "Pages" },
  { value: "category", label: "Categories" },
  { value: "sculpture", label: "Sculptures" },
];

function editHref(row: SeoRow) {
  if (row.type === "page") return `/admin/pages/${row.id}`;
  if (row.type === "category") return "/admin/categories";
  return `/admin/sculptures/${row.id}`;
}

function StatusFor({ row }: { row: SeoRow }) {
  if (row.missing.length === 0) return <Badge tone="success">Complete</Badge>;
  if (row.missing.length === 2) return <Badge tone="danger">Missing title &amp; description</Badge>;
  return <Badge tone="warning">Missing {row.missing[0]}</Badge>;
}

function MetaCell({ value, max }: { value: string | null; max: number }) {
  if (!value) return <span className="text-xs italic text-mist">Not set — falls back to defaults</span>;
  const len = value.length;
  const over = len > max;
  return (
    <div className="min-w-0">
      <p className="line-clamp-2 break-words text-plum/85" title={value}>
        {value}
      </p>
      <p className={`mt-0.5 flex items-center gap-1 text-xs ${over ? "font-semibold text-amber-700" : "text-mist"}`}>
        {over && <AlertTriangle size={12} aria-hidden />}
        {len}/{max} characters{over ? " — may be cut off in search results" : ""}
      </p>
    </div>
  );
}

function SummaryTile({ label, value, tone, icon }: { label: string; value: number; tone: "plum" | "warning" | "success"; icon: ReactNode }) {
  const toneClass = { plum: "bg-lavender text-plum", warning: "bg-amber-50 text-amber-800", success: "bg-emerald-50 text-emerald-800" }[tone];
  return (
    <div className="flex items-center gap-4 rounded-xl border border-gold/25 bg-white p-4">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${toneClass}`}>{icon}</span>
      <div>
        <p className="font-display text-3xl font-semibold leading-none text-plum">{value}</p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-mist">{label}</p>
      </div>
    </div>
  );
}

export default function SeoPage() {
  const { user } = useAuth();
  const [type, setType] = useState<SeoType | "all">("all");
  const [onlyMissing, setOnlyMissing] = useState(false);
  const { data, error, loading, reload } = useApi(() => api.get<{ data: SeoRow[] }>("/admin/seo"), []);

  const all = useMemo(() => data?.data ?? [], [data]);
  const summary = useMemo(
    () => ({
      total: all.length,
      title: all.filter((r) => r.missing.includes("title")).length,
      description: all.filter((r) => r.missing.includes("description")).length,
      complete: all.filter((r) => r.missing.length === 0).length,
    }),
    [all],
  );
  const rows = useMemo(() => all.filter((r) => (type === "all" || r.type === type) && (!onlyMissing || r.missing.length > 0)), [all, type, onlyMissing]);

  return (
    <>
      <PageHeader
        title="SEO Settings"
        description={`How each page, category and sculpture appears in search results. Aim for titles of about ${TITLE_MAX} characters and descriptions of about ${DESCRIPTION_MAX}. Use Edit to change them in the matching editor.`}
        actions={
          user?.role === "admin" ? (
            <LinkButton href="/admin/settings" variant="outline" icon={<Settings size={16} />}>
              Global SEO defaults
            </LinkButton>
          ) : undefined
        }
      />

      {loading && !data ? (
        <Card>
          <LoadingState label="Checking SEO…" />
        </Card>
      ) : error && !data ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <SummaryTile label="Items checked" value={summary.total} tone="plum" icon={<FileText size={18} />} />
            <SummaryTile label="Missing title" value={summary.title} tone={summary.title ? "warning" : "success"} icon={<AlertTriangle size={18} />} />
            <SummaryTile label="Missing description" value={summary.description} tone={summary.description ? "warning" : "success"} icon={<AlertTriangle size={18} />} />
            <SummaryTile label="Complete" value={summary.complete} tone="success" icon={<CheckCircle2 size={18} />} />
          </div>

          <Card padded={false}>
            <div className="flex flex-col gap-3 border-b border-gold/15 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div role="group" aria-label="Filter by type" className="flex flex-wrap gap-1">
                {TYPE_FILTERS.map((f) => {
                  const active = f.value === type;
                  const count = f.value === "all" ? all.length : all.filter((r) => r.type === f.value).length;
                  return (
                    <button
                      key={f.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setType(f.value)}
                      className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${active ? "bg-lavender text-plum ring-1 ring-inset ring-lilac" : "text-plum/60 hover:bg-lavender/40 hover:text-plum"}`}
                    >
                      {f.label} <span className="text-xs font-normal text-mist">({count})</span>
                    </button>
                  );
                })}
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-plum">
                <input type="checkbox" checked={onlyMissing} onChange={(e) => setOnlyMissing(e.target.checked)} className="h-4 w-4 accent-plum" />
                Only show items needing attention
              </label>
            </div>

            {rows.length === 0 ? (
              <EmptyState
                title={all.length === 0 ? "Nothing to check yet" : onlyMissing ? "Everything here is complete" : "No items of this type"}
                description={all.length === 0 ? "Pages, categories and sculptures will appear here once they exist." : undefined}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] text-left text-sm">
                  <thead className="border-b border-gold/15 text-xs uppercase tracking-wider text-mist">
                    <tr>
                      <th scope="col" className="px-5 py-3 font-semibold">
                        Item
                      </th>
                      <th scope="col" className="w-[28%] px-3 py-3 font-semibold">
                        SEO title
                      </th>
                      <th scope="col" className="w-[32%] px-3 py-3 font-semibold">
                        Meta description
                      </th>
                      <th scope="col" className="px-3 py-3 font-semibold">
                        Status
                      </th>
                      <th scope="col" className="px-5 py-3 text-right font-semibold">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gold/10">
                    {rows.map((r) => (
                      <tr key={`${r.type}-${r.id}`} className="align-top">
                        <td className="px-5 py-3">
                          <p className="font-semibold text-plum">{r.name}</p>
                          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-mist">
                            <Badge>{TYPE_LABEL[r.type]}</Badge>
                            <code className="break-all">{r.path}</code>
                          </p>
                        </td>
                        <td className="px-3 py-3">
                          <MetaCell value={r.seo_title} max={TITLE_MAX} />
                        </td>
                        <td className="px-3 py-3">
                          <MetaCell value={r.seo_description} max={DESCRIPTION_MAX} />
                        </td>
                        <td className="whitespace-nowrap px-3 py-3">
                          <StatusFor row={r} />
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Link
                            href={editHref(r)}
                            className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold text-plum/80 transition-colors hover:bg-lavender/60 hover:text-plum"
                            aria-label={`Edit SEO for ${r.name}`}
                          >
                            <Pencil size={14} /> Edit
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </>
  );
}
