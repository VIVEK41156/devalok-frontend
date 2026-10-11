"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Save } from "lucide-react";
import { api, type Media, type Page } from "@/lib/admin-api";
import { refreshPublicSite } from "@/app/admin/actions";
import { Button, Card, ErrorState, LoadingState, PageHeader, SelectField, StatusBadge, TextArea, TextField, useToast } from "@/components/admin/ui";
import { ImageField } from "@/components/admin/MediaPicker";
import SectionsEditor from "@/components/admin/SectionsEditor";
import { saveErrors, useApi } from "@/components/admin/useApi";

function PageForm({ page }: { page: Page }) {
  const toast = useToast();
  const [f, setF] = useState({
    title: page.title,
    intro: page.intro ?? "",
    content: page.content ?? "",
    status: page.status,
    featured: (page.featured_image ?? null) as Media | null,
    og: (page.seo?.og_image ?? null) as Media | null,
    seo_title: page.seo_title ?? "",
    seo_description: page.seo_description ?? "",
    canonical_url: page.canonical_url ?? "",
    og_title: page.og_title ?? "",
    og_description: page.og_description ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));
  const n = (v: string) => (v.trim() ? v.trim() : null);

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/pages/${page.id}`, {
        title: f.title.trim(),
        intro: n(f.intro),
        content: n(f.content),
        status: f.status,
        featured_media_id: f.featured?.id ?? null,
        og_media_id: f.og?.id ?? null,
        seo_title: n(f.seo_title),
        seo_description: n(f.seo_description),
        canonical_url: n(f.canonical_url),
        og_title: n(f.og_title),
        og_description: n(f.og_description),
      });
      await refreshPublicSite();
      setErrors({});
      toast({ tone: "success", message: "Page saved. The website is updated." });
    } catch (e) {
      const { fields, message } = saveErrors(e);
      setErrors(fields);
      toast({ tone: "error", message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="flex min-w-0 flex-col gap-6">
        <Card title="Content">
          <div className="space-y-5">
            <TextField label="Page title" required maxLength={160} value={f.title} onChange={(e) => set("title", e.target.value)} error={errors.title} hint="Used in menus fallbacks and as the default SEO title." />
            <TextArea label="Introduction" maxLength={2000} rows={3} value={f.intro} onChange={(e) => set("intro", e.target.value)} error={errors.intro} hint="Shown under the page heading." />
            <TextArea label="Main content" maxLength={20000} rows={8} value={f.content} onChange={(e) => set("content", e.target.value)} error={errors.content} hint="Plain text. Separate paragraphs with a blank line. (Used on the About page.)" />
            <ImageField label="Featured image" media={f.featured} onChange={(m) => set("featured", m)} hint="Used as the page header photo where the design has one." />
          </div>
        </Card>
        <SectionsEditor page={page} />
      </div>
      <aside className="flex flex-col gap-6 xl:sticky xl:top-24 xl:self-start">
        <Card title="Publishing">
          <div className="space-y-4">
            <SelectField label="Status" value={f.status} onChange={(e) => set("status", e.target.value as Page["status"])} hint="A draft page's CMS content is hidden; the page shows its built-in defaults.">
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </SelectField>
            <Button loading={saving} icon={<Save size={16} />} className="w-full" onClick={() => void save()}>
              Save page
            </Button>
          </div>
        </Card>
        <Card title="SEO">
          <div className="space-y-4">
            <TextField label="SEO title" maxLength={160} value={f.seo_title} onChange={(e) => set("seo_title", e.target.value)} error={errors.seo_title} hint="≈ 60 characters" />
            <TextArea label="Meta description" maxLength={320} rows={3} value={f.seo_description} onChange={(e) => set("seo_description", e.target.value)} error={errors.seo_description} hint="≈ 160 characters" />
            <TextField label="Canonical URL (optional)" maxLength={500} value={f.canonical_url} onChange={(e) => set("canonical_url", e.target.value)} error={errors.canonical_url} />
            <TextField label="Social share title" maxLength={160} value={f.og_title} onChange={(e) => set("og_title", e.target.value)} />
            <TextArea label="Social share description" maxLength={320} rows={2} value={f.og_description} onChange={(e) => set("og_description", e.target.value)} />
            <ImageField label="Social share image" media={f.og} onChange={(m) => set("og", m)} />
          </div>
        </Card>
      </aside>
    </div>
  );
}

export default function EditPagePage() {
  const { id } = useParams<{ id: string }>();
  const res = useApi(() => api.get<{ data: Page }>(`/admin/pages/${encodeURIComponent(id)}`).then((r) => r.data), [id]);
  return (
    <>
      <PageHeader title={res.data ? res.data.title : "Edit page"} description={res.data ? <span className="inline-flex items-center gap-2">/{res.data.slug === "home" ? "" : res.data.slug} <StatusBadge status={res.data.status} /></span> : undefined} />
      {res.loading && !res.data ? <LoadingState /> : res.error ? <ErrorState message={res.error} onRetry={res.reload} /> : res.data ? <PageForm key={res.data.id} page={res.data} /> : null}
    </>
  );
}
