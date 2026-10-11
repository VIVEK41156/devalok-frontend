"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, FolderPlus, Pencil, Trash2 } from "lucide-react";
import { api, ApiError, type Category, type Media } from "@/lib/admin-api";
import { refreshPublicSite } from "@/app/admin/actions";
import { Badge, Button, Card, EmptyState, ErrorState, LoadingState, Modal, PageHeader, SelectField, TextArea, TextField, Toggle, useToast } from "@/components/admin/ui";
import { ImageField, Thumb } from "@/components/admin/MediaPicker";
import { saveErrors, useApi } from "@/components/admin/useApi";

interface Draft {
  id?: number;
  name: string;
  short_name: string;
  slug: string;
  tagline: string;
  description: string;
  parent_id: string;
  cover: Media | null;
  is_published: boolean;
  sort_order: string;
  seo_title: string;
  seo_description: string;
}

const blank = (order: number): Draft => ({ name: "", short_name: "", slug: "", tagline: "", description: "", parent_id: "", cover: null, is_published: true, sort_order: String(order), seo_title: "", seo_description: "" });
const fromCategory = (c: Category): Draft => ({
  id: c.id,
  name: c.name,
  short_name: c.short_name === c.name ? "" : c.short_name,
  slug: c.slug,
  tagline: c.tagline ?? "",
  description: c.description ?? "",
  parent_id: c.parent_id ? String(c.parent_id) : "",
  cover: c.cover,
  is_published: c.is_published,
  sort_order: String(c.sort_order),
  seo_title: c.seo_title ?? "",
  seo_description: c.seo_description ?? "",
});
const n = (v: string) => (v.trim() ? v.trim() : null);

export default function CategoriesPage() {
  const params = useSearchParams();
  const toast = useToast();
  const list = useApi(() => api.get<{ data: Category[] }>("/admin/categories").then((r) => r.data), []);
  const cats = list.data ?? [];
  const [draft, setDraft] = useState<Draft | null>(params.get("new") ? blank(0) : null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [reassignTo, setReassignTo] = useState("");

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));

  const save = async () => {
    if (!draft) return;
    if (!draft.name.trim()) {
      setErrors({ name: "A name is required." });
      return;
    }
    setSaving(true);
    const body = {
      name: draft.name.trim(),
      short_name: n(draft.short_name),
      slug: n(draft.slug),
      tagline: n(draft.tagline),
      description: n(draft.description),
      parent_id: draft.parent_id ? Number(draft.parent_id) : null,
      cover_media_id: draft.cover?.id ?? null,
      is_published: draft.is_published,
      sort_order: Number(draft.sort_order) || 0,
      seo_title: n(draft.seo_title),
      seo_description: n(draft.seo_description),
    };
    try {
      if (draft.id) await api.put(`/admin/categories/${draft.id}`, body);
      else await api.post("/admin/categories", body);
      await refreshPublicSite();
      toast({ tone: "success", message: draft.id ? "Category saved." : "Category created." });
      setDraft(null);
      setErrors({});
      await list.reload();
    } catch (e) {
      const { fields, message } = saveErrors(e);
      setErrors(fields);
      toast({ tone: "error", message });
    } finally {
      setSaving(false);
    }
  };

  const move = async (i: number, d: -1 | 1) => {
    const ids = cats.map((c) => c.id);
    const j = i + d;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    try {
      await api.post("/admin/categories/reorder", { ids });
      await refreshPublicSite();
      await list.reload();
    } catch (e) {
      toast({ tone: "error", message: e instanceof ApiError ? e.message : "Could not reorder." });
    }
  };

  const togglePublish = async (c: Category) => {
    try {
      await api.put(`/admin/categories/${c.id}`, { name: c.name, slug: c.slug, is_published: !c.is_published, sort_order: c.sort_order, cover_media_id: c.cover_media_id, tagline: c.tagline, description: c.description, short_name: c.short_name === c.name ? null : c.short_name, parent_id: c.parent_id, seo_title: c.seo_title, seo_description: c.seo_description });
      await refreshPublicSite();
      toast({ tone: "success", message: c.is_published ? `“${c.name}” hidden from the website.` : `“${c.name}” published.` });
      await list.reload();
    } catch (e) {
      toast({ tone: "error", message: saveErrors(e).message });
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await api.del(`/admin/categories/${deleting.id}`, reassignTo ? { reassign_to: Number(reassignTo) } : undefined);
      await refreshPublicSite();
      toast({ tone: "success", message: "Category deleted." });
      setDeleting(null);
      setReassignTo("");
      await list.reload();
    } catch (e) {
      const { fields, message } = saveErrors(e);
      toast({ tone: "error", message: fields.reassign_to ?? message });
    }
  };

  return (
    <>
      <PageHeader
        title="Categories"
        description="Collections shown in the Products menu, gallery filters and homepage. Unpublished categories (and their sculptures) are hidden from the website."
        actions={
          <Button icon={<FolderPlus size={16} />} onClick={() => setDraft(blank(cats.length + 1))}>
            Add category
          </Button>
        }
      />
      <Card padded={false}>
        {list.loading && !list.data ? (
          <LoadingState />
        ) : list.error ? (
          <div className="p-5">
            <ErrorState message={list.error} onRetry={list.reload} />
          </div>
        ) : !cats.length ? (
          <EmptyState title="No categories yet" action={<Button onClick={() => setDraft(blank(1))}>Add category</Button>} />
        ) : (
          <ul className="divide-y divide-gold/10">
            {cats.map((c, i) => (
              <li key={c.id} className="flex flex-wrap items-center gap-4 px-4 py-3 sm:flex-nowrap">
                <div className="flex flex-col">
                  <Button variant="ghost" className="px-2 py-1" aria-label={`Move ${c.name} up`} disabled={i === 0} onClick={() => void move(i, -1)} icon={<ArrowUp size={14} />} />
                  <Button variant="ghost" className="px-2 py-1" aria-label={`Move ${c.name} down`} disabled={i === cats.length - 1} onClick={() => void move(i, 1)} icon={<ArrowDown size={14} />} />
                </div>
                <Thumb media={c.cover} className="h-16 w-20 shrink-0 rounded" />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-semibold text-plum">
                    {c.name}
                    {c.is_published ? <Badge tone="success">Published</Badge> : <Badge tone="warning">Hidden</Badge>}
                  </p>
                  <p className="text-xs text-mist">
                    /{c.slug} · {c.sculptures_count ?? 0} sculpture(s){c.tagline ? ` · ${c.tagline}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" className="px-3 py-1.5 text-xs" onClick={() => void togglePublish(c)}>
                    {c.is_published ? "Unpublish" : "Publish"}
                  </Button>
                  <Button variant="ghost" aria-label={`Edit ${c.name}`} icon={<Pencil size={16} />} onClick={() => setDraft(fromCategory(c))} />
                  <Button
                    variant="ghost"
                    aria-label={`Delete ${c.name}`}
                    icon={<Trash2 size={16} className="text-red-700" />}
                    onClick={() => {
                      setDeleting(c);
                      setReassignTo("");
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal
        open={!!draft}
        onClose={() => {
          setDraft(null);
          setErrors({});
        }}
        title={draft?.id ? "Edit category" : "Add category"}
        wide
        footer={
          <>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button loading={saving} onClick={() => void save()}>
              {draft?.id ? "Save category" : "Create category"}
            </Button>
          </>
        }
      >
        {draft && (
          <div className="grid gap-5 md:grid-cols-2">
            <TextField label="Name" required maxLength={120} value={draft.name} onChange={(e) => set("name", e.target.value)} error={errors.name} hint="e.g. Stone Sculptures" />
            <TextField label="Short name" maxLength={60} value={draft.short_name} onChange={(e) => set("short_name", e.target.value)} hint="Used in filters, e.g. “Stone”." error={errors.short_name} />
            <TextField label="URL slug" maxLength={140} value={draft.slug} onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} hint="Leave blank to generate from the name." error={errors.slug} />
            <SelectField label="Parent category (optional)" value={draft.parent_id} onChange={(e) => set("parent_id", e.target.value)} error={errors.parent_id}>
              <option value="">None</option>
              {cats
                .filter((c) => c.id !== draft.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </SelectField>
            <div className="md:col-span-2">
              <TextField label="Tagline" maxLength={200} value={draft.tagline} onChange={(e) => set("tagline", e.target.value)} error={errors.tagline} />
            </div>
            <div className="md:col-span-2">
              <TextArea label="Description" maxLength={5000} rows={3} value={draft.description} onChange={(e) => set("description", e.target.value)} error={errors.description} />
            </div>
            <ImageField label="Cover image" media={draft.cover} onChange={(m) => set("cover", m)} />
            <div className="space-y-4">
              <Toggle label="Published" hint="Hidden categories and their sculptures are not shown publicly." checked={draft.is_published} onChange={(v) => set("is_published", v)} />
              <TextField label="Display order" type="number" value={draft.sort_order} onChange={(e) => set("sort_order", e.target.value)} />
            </div>
            <TextField label="SEO title" maxLength={160} value={draft.seo_title} onChange={(e) => set("seo_title", e.target.value)} error={errors.seo_title} />
            <TextArea label="SEO description" maxLength={320} rows={2} value={draft.seo_description} onChange={(e) => set("seo_description", e.target.value)} error={errors.seo_description} />
          </div>
        )}
      </Modal>

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete category?"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button variant="danger" disabled={!!deleting?.sculptures_count && !reassignTo} onClick={() => void confirmDelete()}>
              Delete category
            </Button>
          </>
        }
      >
        {deleting && (
          <div className="space-y-4 text-sm text-plum/80">
            <p>
              <strong>{deleting.name}</strong> will be removed. This cannot be undone.
            </p>
            {deleting.sculptures_count ? (
              <SelectField label={`Move its ${deleting.sculptures_count} sculpture(s) to`} required value={reassignTo} onChange={(e) => setReassignTo(e.target.value)} hint="Sculptures are never deleted with their category.">
                <option value="">Choose a category…</option>
                {cats
                  .filter((c) => c.id !== deleting.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </SelectField>
            ) : (
              <p className="text-mist">This category has no sculptures.</p>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
