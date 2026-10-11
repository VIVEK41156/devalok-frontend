"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ExternalLink, ImagePlus, Plus, Save, Trash2, X } from "lucide-react";
import { api, type Category, type DetailView, type Media, type Sculpture } from "@/lib/admin-api";
import { refreshPublicSite } from "@/app/admin/actions";
import { Button, Card, SelectField, TextArea, TextField, Toggle, useConfirm, useToast } from "./ui";
import { ImageField, MediaPickerModal, Thumb } from "./MediaPicker";
import { saveErrors } from "./useApi";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);

interface FormState {
  title: string;
  slug: string;
  category_id: string;
  status: "draft" | "published";
  is_featured: boolean;
  sort_order: string;
  subject: string;
  short_description: string;
  description: string;
  materials: string;
  dimensions: string;
  weight: string;
  craftsmanship: string;
  cover: Media | null;
  cutout: Media | null;
  gallery: Media[];
  detail_views: DetailView[];
  reference_credit: string;
  reference_license: string;
  reference_url: string;
  seo_title: string;
  seo_description: string;
}

function fromSculpture(s?: Sculpture | null): FormState {
  return {
    title: s?.title ?? "",
    slug: s?.slug ?? "",
    category_id: s?.category_id ? String(s.category_id) : "",
    status: s?.status ?? "draft",
    is_featured: s?.is_featured ?? false,
    sort_order: String(s?.sort_order ?? 0),
    subject: s?.subject ?? "",
    short_description: s?.short_description ?? "",
    description: s?.description ?? "",
    materials: s?.materials ?? "",
    dimensions: s?.dimensions ?? "",
    weight: s?.weight ?? "",
    craftsmanship: s?.craftsmanship ?? "",
    cover: s?.cover ?? null,
    cutout: s?.cutout ?? null,
    gallery: s?.gallery ?? [],
    detail_views: s?.detail_views ?? [],
    reference_credit: s?.reference_credit ?? "",
    reference_license: s?.reference_license ?? "",
    reference_url: s?.reference_url ?? "",
    seo_title: s?.seo_title ?? "",
    seo_description: s?.seo_description ?? "",
  };
}

const nullIfEmpty = (v: string) => (v.trim() === "" ? null : v.trim());

export default function SculptureForm({ sculpture, categories }: { sculpture?: Sculpture | null; categories: Category[] }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [f, setF] = useState<FormState>(() => fromSculpture(sculpture));
  const [slugTouched, setSlugTouched] = useState(!!sculpture);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const isNew = !sculpture;

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((s) => ({ ...s, [k]: v }));
  const onTitle = (v: string) => setF((s) => ({ ...s, title: v, slug: slugTouched ? s.slug : slugify(v) }));

  const moveGallery = (i: number, d: -1 | 1) =>
    setF((s) => {
      const g = [...s.gallery];
      const j = i + d;
      if (j < 0 || j >= g.length) return s;
      [g[i], g[j]] = [g[j], g[i]];
      return { ...s, gallery: g };
    });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const local: Record<string, string> = {};
    if (!f.title.trim()) local.title = "A title is required.";
    if (!f.category_id) local.category_id = "Choose a category.";
    if (f.status === "published" && !f.cover) local.cover_media_id = "Add a cover image before publishing.";
    setErrors(local);
    if (Object.keys(local).length) {
      toast({ tone: "error", message: "Please fix the highlighted fields." });
      return;
    }
    setSaving(true);
    const body = {
      title: f.title.trim(),
      slug: nullIfEmpty(f.slug),
      category_id: Number(f.category_id),
      status: f.status,
      is_featured: f.is_featured,
      sort_order: Number(f.sort_order) || 0,
      subject: nullIfEmpty(f.subject),
      short_description: nullIfEmpty(f.short_description),
      description: nullIfEmpty(f.description),
      materials: nullIfEmpty(f.materials),
      dimensions: nullIfEmpty(f.dimensions),
      weight: nullIfEmpty(f.weight),
      craftsmanship: nullIfEmpty(f.craftsmanship),
      cover_media_id: f.cover?.id ?? null,
      cutout_media_id: f.cutout?.id ?? null,
      gallery_media_ids: f.gallery.map((m) => m.id),
      detail_views: f.detail_views.map((d) => ({ ...d, x: Number(d.x), y: Number(d.y), zoom: Number(d.zoom) })),
      reference_credit: nullIfEmpty(f.reference_credit),
      reference_license: nullIfEmpty(f.reference_license),
      reference_url: nullIfEmpty(f.reference_url),
      seo_title: nullIfEmpty(f.seo_title),
      seo_description: nullIfEmpty(f.seo_description),
    };
    try {
      const res = isNew ? await api.post<{ data: Sculpture }>("/admin/sculptures", body) : await api.put<{ data: Sculpture }>(`/admin/sculptures/${sculpture!.id}`, body);
      await refreshPublicSite();
      toast({ tone: "success", message: isNew ? "Sculpture created." : "Changes saved." });
      if (isNew) router.replace(`/admin/sculptures/${res.data.id}`);
      else {
        setF(fromSculpture(res.data));
        setErrors({});
      }
    } catch (err) {
      const { fields, message } = saveErrors(err);
      setErrors(fields);
      toast({ tone: "error", message });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!sculpture) return;
    const ok = await confirm({ title: "Delete sculpture?", message: `“${sculpture.title}” will be removed permanently. Images stay in the media library.`, confirmLabel: "Delete", danger: true });
    if (!ok) return;
    try {
      await api.del(`/admin/sculptures/${sculpture.id}`);
      await refreshPublicSite();
      toast({ tone: "success", message: "Sculpture deleted." });
      router.replace("/admin/sculptures");
    } catch (err) {
      toast({ tone: "error", message: saveErrors(err).message });
    }
  };

  const seoTitle = f.seo_title || f.title || "Sculpture title";
  const seoDesc = f.seo_description || f.short_description || "A short description of the sculpture appears here in search results.";

  return (
    <form onSubmit={submit} noValidate className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="flex min-w-0 flex-col gap-6">
        <Card title="Details">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <TextField label="Title" required maxLength={160} value={f.title} onChange={(e) => onTitle(e.target.value)} error={errors.title} />
            </div>
            <TextField
              label="URL slug"
              maxLength={180}
              value={f.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", slugify(e.target.value));
              }}
              hint="Lowercase letters, numbers and hyphens. Leave blank to generate from the title."
              error={errors.slug}
            />
            <SelectField label="Category" required value={f.category_id} onChange={(e) => set("category_id", e.target.value)} error={errors.category_id}>
              <option value="">Choose…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.is_published ? "" : " (unpublished)"}
                </option>
              ))}
            </SelectField>
            <TextField label="Deity / subject" maxLength={80} value={f.subject} onChange={(e) => set("subject", e.target.value)} hint="e.g. Ganesha, Krishna, Devi" error={errors.subject} />
            <TextField label="Materials / finish" maxLength={160} value={f.materials} onChange={(e) => set("materials", e.target.value)} hint="Only verified information." error={errors.materials} />
            <div className="md:col-span-2">
              <TextArea label="Short description" maxLength={300} rows={2} value={f.short_description} onChange={(e) => set("short_description", e.target.value)} hint="Shown on cards and in search results." error={errors.short_description} />
            </div>
            <div className="md:col-span-2">
              <TextArea label="Full description" maxLength={10000} rows={6} value={f.description} onChange={(e) => set("description", e.target.value)} error={errors.description} />
            </div>
          </div>
        </Card>

        <Card title="Images">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <ImageField label="Cover image" media={f.cover} onChange={(m) => set("cover", m)} hint="Main photo used on cards and in the viewer." />
              {errors.cover_media_id && <p className="mt-1.5 text-xs font-medium text-red-700">{errors.cover_media_id}</p>}
            </div>
            <ImageField label="Transparent cut-out (optional)" media={f.cutout} onChange={(m) => set("cutout", m)} hint="PNG/WebP with a transparent background; staged on a lavender backdrop." />
          </div>
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-plum">Gallery images</p>
              <Button type="button" variant="outline" icon={<ImagePlus size={16} />} onClick={() => setGalleryOpen(true)}>
                Add images
              </Button>
            </div>
            {f.gallery.length === 0 ? (
              <p className="rounded-md border border-dashed border-plum/20 px-4 py-6 text-center text-sm text-mist">No gallery images yet. They appear as extra views in the sculpture viewer.</p>
            ) : (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                {f.gallery.map((m, i) => (
                  <li key={m.id} className="overflow-hidden rounded-md border border-gold/25 bg-white">
                    <Thumb media={m} className="aspect-[3/4]" />
                    <div className="flex items-center justify-between px-1 py-1">
                      <Button type="button" variant="ghost" className="px-2 py-1" aria-label="Move earlier" disabled={i === 0} onClick={() => moveGallery(i, -1)} icon={<ArrowUp size={14} />} />
                      <Button type="button" variant="ghost" className="px-2 py-1" aria-label="Move later" disabled={i === f.gallery.length - 1} onClick={() => moveGallery(i, 1)} icon={<ArrowDown size={14} />} />
                      <Button type="button" variant="ghost" className="px-2 py-1" aria-label="Remove from gallery" onClick={() => set("gallery", f.gallery.filter((g) => g.id !== m.id))} icon={<X size={14} className="text-red-700" />} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {errors.gallery_media_ids && <p className="mt-1.5 text-xs font-medium text-red-700">{errors.gallery_media_ids}</p>}
          </div>
          <MediaPickerModal
            open={galleryOpen}
            multiple
            title="Add gallery images"
            onClose={() => setGalleryOpen(false)}
            onSelect={(ms) => set("gallery", [...f.gallery, ...ms.filter((m) => !f.gallery.some((g) => g.id === m.id))])}
          />
        </Card>

        <Card title="Physical details & craftsmanship">
          <div className="grid gap-5 md:grid-cols-2">
            <TextField label="Dimensions (optional)" maxLength={120} value={f.dimensions} onChange={(e) => set("dimensions", e.target.value)} hint="e.g. 36 × 18 × 10 in. Leave blank if not confirmed." />
            <TextField label="Weight (optional)" maxLength={60} value={f.weight} onChange={(e) => set("weight", e.target.value)} hint="Leave blank if not confirmed." />
            <div className="md:col-span-2">
              <TextArea label="Craftsmanship notes (optional)" maxLength={5000} rows={3} value={f.craftsmanship} onChange={(e) => set("craftsmanship", e.target.value)} />
            </div>
          </div>
        </Card>

        <Card
          title="Detail views"
          actions={
            <Button type="button" variant="outline" icon={<Plus size={16} />} disabled={f.detail_views.length >= 6} onClick={() => set("detail_views", [...f.detail_views, { label: "Detail", x: 50, y: 30, zoom: 2 }])}>
              Add view
            </Button>
          }
        >
          <p className="mb-4 text-sm text-mist">Framed close-ups of the cover photo shown as extra thumbnails in the viewer. X/Y is the focal point in %, zoom is 1–5.</p>
          {f.detail_views.length === 0 ? (
            <p className="text-sm text-mist">No detail views.</p>
          ) : (
            <ul className="space-y-3">
              {f.detail_views.map((d, i) => (
                <li key={i} className="grid grid-cols-2 items-end gap-3 rounded-md bg-parchment/50 p-3 sm:grid-cols-[1fr_90px_90px_90px_auto]">
                  <div className="col-span-2 sm:col-span-1">
                    <TextField label="Label" maxLength={40} value={d.label} onChange={(e) => set("detail_views", f.detail_views.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} error={errors[`detail_views.${i}.label`]} />
                  </div>
                  {(["x", "y", "zoom"] as const).map((k) => (
                    <TextField
                      key={k}
                      label={k === "zoom" ? "Zoom" : k.toUpperCase()}
                      type="number"
                      step={k === "zoom" ? 0.1 : 1}
                      min={k === "zoom" ? 1 : 0}
                      max={k === "zoom" ? 5 : 100}
                      value={String(d[k])}
                      onChange={(e) => set("detail_views", f.detail_views.map((x, j) => (j === i ? { ...x, [k]: Number(e.target.value) } : x)))}
                      error={errors[`detail_views.${i}.${k}`]}
                    />
                  ))}
                  <Button type="button" variant="ghost" aria-label="Remove view" onClick={() => set("detail_views", f.detail_views.filter((_, j) => j !== i))} icon={<Trash2 size={16} className="text-red-700" />} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Image credit (reference photos only)">
          <p className="mb-4 text-sm text-mist">Fill these only when the photo is not Devalok&rsquo;s own work (e.g. an openly licensed museum image). The site then labels it &ldquo;Reference image&rdquo;.</p>
          <div className="grid gap-5 md:grid-cols-3">
            <TextField label="Credit" maxLength={200} value={f.reference_credit} onChange={(e) => set("reference_credit", e.target.value)} />
            <TextField label="License" maxLength={60} value={f.reference_license} onChange={(e) => set("reference_license", e.target.value)} hint="e.g. CC0, Public domain" />
            <TextField label="Source URL" maxLength={500} value={f.reference_url} onChange={(e) => set("reference_url", e.target.value)} error={errors.reference_url} />
          </div>
        </Card>
      </div>

      <aside className="flex flex-col gap-6 xl:sticky xl:top-24 xl:self-start">
        <Card title="Publishing">
          <div className="space-y-5">
            <SelectField label="Status" value={f.status} onChange={(e) => set("status", e.target.value as FormState["status"])} error={errors.status} hint="Drafts are never shown on the public website.">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </SelectField>
            <Toggle label="Featured" hint="Shown in the hero, 3D hall and signature grid." checked={f.is_featured} onChange={(v) => set("is_featured", v)} />
            <TextField label="Display order" type="number" value={f.sort_order} onChange={(e) => set("sort_order", e.target.value)} hint="Lower numbers appear first." error={errors.sort_order} />
            <div className="flex flex-wrap gap-2 pt-1">
              <Button type="submit" loading={saving} icon={<Save size={16} />} className="flex-1">
                {isNew ? "Create sculpture" : "Save changes"}
              </Button>
              {!isNew && (
                <Button type="button" variant="outline" onClick={() => void remove()} icon={<Trash2 size={16} className="text-red-700" />} aria-label="Delete sculpture" />
              )}
            </div>
            {!isNew && sculpture?.status === "published" && (
              <Link href="/gallery" target="_blank" className="inline-flex items-center gap-1.5 text-sm text-gold-deep hover:underline">
                View on website <ExternalLink size={14} />
              </Link>
            )}
          </div>
        </Card>

        <Card title="SEO">
          <div className="space-y-4">
            <TextField label="SEO title" maxLength={160} value={f.seo_title} onChange={(e) => set("seo_title", e.target.value)} hint="Recommended ≈ 60 characters. Defaults to the title." error={errors.seo_title} />
            <TextArea label="Meta description" maxLength={320} rows={3} value={f.seo_description} onChange={(e) => set("seo_description", e.target.value)} hint="Recommended ≈ 160 characters." error={errors.seo_description} />
            <div className="rounded-md border border-plum/10 bg-parchment/40 p-3">
              <p className="text-xs uppercase tracking-wider text-mist">Search preview</p>
              <p className="mt-1 truncate text-[15px] text-[#1a0dab]">{seoTitle}</p>
              <p className="text-xs text-emerald-800">devaloksculptures.in › gallery</p>
              <p className="mt-0.5 line-clamp-2 text-xs text-plum/70">{seoDesc}</p>
            </div>
          </div>
        </Card>
      </aside>
    </form>
  );
}
