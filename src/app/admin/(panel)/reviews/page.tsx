"use client";

import { useState } from "react";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import { api, type Media } from "@/lib/admin-api";
import { refreshPublicSite } from "@/app/admin/actions";
import { Badge, Button, Card, EmptyState, ErrorState, LoadingState, Modal, PageHeader, TextArea, TextField, Toggle, useConfirm, useToast } from "@/components/admin/ui";
import { ImageField, Thumb } from "@/components/admin/MediaPicker";
import { saveErrors, useApi } from "@/components/admin/useApi";

interface Review {
  id: number;
  name: string;
  location: string | null;
  rating: number;
  content: string;
  is_sample: boolean;
  is_published: boolean;
  sort_order: number;
  avatar: Media | null;
}

type Draft = Omit<Review, "id"> & { id?: number };
const blank = (order: number): Draft => ({ name: "", location: "", rating: 5, content: "", is_sample: false, is_published: true, sort_order: order, avatar: null });

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold text-plum">Rating</p>
      <div className="flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((i) => (
          <button key={i} type="button" role="radio" aria-checked={value === i} aria-label={`${i} star${i > 1 ? "s" : ""}`} onClick={() => onChange(i)} className="rounded p-1 transition hover:scale-110">
            <Star size={26} className={i <= value ? "fill-gold text-gold" : "text-plum/20"} />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ReviewsAdminPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const list = useApi(() => api.get<{ data: Review[] }>("/admin/reviews").then((r) => r.data), []);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));

  const body = (d: Draft) => ({
    name: d.name.trim(),
    location: d.location?.trim() || null,
    rating: d.rating,
    content: d.content.trim(),
    is_sample: d.is_sample,
    is_published: d.is_published,
    sort_order: Number(d.sort_order) || 0,
    avatar_media_id: d.avatar?.id ?? null,
  });

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      if (draft.id) await api.put(`/admin/reviews/${draft.id}`, body(draft));
      else await api.post("/admin/reviews", body(draft));
      await refreshPublicSite();
      toast({ tone: "success", message: draft.id ? "Review saved." : "Review added. It appears on the homepage." });
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

  const togglePublished = async (r: Review) => {
    try {
      await api.put(`/admin/reviews/${r.id}`, body({ ...r, is_published: !r.is_published }));
      await refreshPublicSite();
      toast({ tone: "success", message: r.is_published ? "Review hidden from the website." : "Review published." });
      await list.reload();
    } catch (e) {
      toast({ tone: "error", message: saveErrors(e).message });
    }
  };

  const remove = async (r: Review) => {
    if (!(await confirm({ title: "Delete review?", message: `The review by ${r.name} will be removed permanently.`, confirmLabel: "Delete", danger: true }))) return;
    try {
      await api.del(`/admin/reviews/${r.id}`);
      await refreshPublicSite();
      toast({ tone: "success", message: "Review deleted." });
      await list.reload();
    } catch (e) {
      toast({ tone: "error", message: saveErrors(e).message });
    }
  };

  const reviews = list.data ?? [];
  const samples = reviews.filter((r) => r.is_sample).length;

  return (
    <>
      <PageHeader
        title="Reviews"
        description="Client reviews shown in the animated “Kind words” section on the homepage (below Our values). Turn off “Sample” once a review is real."
        actions={
          <Button icon={<Plus size={16} />} onClick={() => setDraft(blank(reviews.length + 1))}>
            Add review
          </Button>
        }
      />
      {samples > 0 && (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {samples} review(s) are placeholder samples and show a “Sample” tag on the website. Replace them with genuine client reviews before launch.
        </p>
      )}
      <Card padded={false}>
        {list.loading && !list.data ? (
          <LoadingState />
        ) : list.error ? (
          <div className="p-5">
            <ErrorState message={list.error} onRetry={list.reload} />
          </div>
        ) : !reviews.length ? (
          <EmptyState title="No reviews yet" description="Add your first client review." action={<Button onClick={() => setDraft(blank(1))}>Add review</Button>} />
        ) : (
          <ul className="divide-y divide-gold/10">
            {reviews.map((r) => (
              <li key={r.id} className="flex flex-wrap items-start gap-4 px-5 py-4 sm:flex-nowrap">
                {r.avatar ? (
                  <Thumb media={r.avatar} className="h-12 w-12 shrink-0 rounded-full" />
                ) : (
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-lavender font-display text-xl text-plum">{r.name.charAt(0)}</span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-semibold text-plum">
                    {r.name}
                    <span className="flex">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} size={13} className={i <= r.rating ? "fill-gold text-gold" : "text-plum/20"} />
                      ))}
                    </span>
                    {r.is_published ? <Badge tone="success">Published</Badge> : <Badge tone="warning">Hidden</Badge>}
                    {r.is_sample && <Badge tone="gold">Sample</Badge>}
                  </p>
                  {r.location && <p className="text-xs text-mist">{r.location}</p>}
                  <p className="mt-1.5 line-clamp-2 text-sm text-plum/75">&ldquo;{r.content}&rdquo;</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" className="px-3 py-1.5 text-xs" onClick={() => void togglePublished(r)}>
                    {r.is_published ? "Hide" : "Publish"}
                  </Button>
                  <Button variant="ghost" aria-label={`Edit review by ${r.name}`} icon={<Pencil size={16} />} onClick={() => { setErrors({}); setDraft({ ...r }); }} />
                  <Button variant="ghost" aria-label={`Delete review by ${r.name}`} icon={<Trash2 size={16} className="text-red-700" />} onClick={() => void remove(r)} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.id ? "Edit review" : "Add review"}
        wide
        footer={
          <>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button loading={saving} onClick={() => void save()}>
              {draft?.id ? "Save review" : "Add review"}
            </Button>
          </>
        }
      >
        {draft && (
          <div className="grid gap-5 md:grid-cols-2">
            <TextField label="Name" required maxLength={120} value={draft.name} onChange={(e) => set("name", e.target.value)} error={errors.name} hint="As the client agreed to be credited, e.g. “Ananya R.”" />
            <TextField label="Location / context" maxLength={120} value={draft.location ?? ""} onChange={(e) => set("location", e.target.value)} error={errors.location} hint="e.g. Home shrine · Bengaluru" />
            <div className="md:col-span-2">
              <TextArea label="Review" required maxLength={1500} rows={4} value={draft.content} onChange={(e) => set("content", e.target.value)} error={errors.content} />
            </div>
            <StarPicker value={draft.rating} onChange={(v) => set("rating", v)} />
            <TextField label="Display order" type="number" value={String(draft.sort_order)} onChange={(e) => set("sort_order", Number(e.target.value))} />
            <ImageField label="Photo (optional)" media={draft.avatar} onChange={(m) => set("avatar", m)} hint="Without a photo the initial is shown." />
            <div className="space-y-4">
              <Toggle label="Published" hint="Show this review on the homepage." checked={draft.is_published} onChange={(v) => set("is_published", v)} />
              <Toggle label="Sample review" hint="Placeholder content; shows a “Sample” tag publicly." checked={draft.is_sample} onChange={(v) => set("is_sample", v)} />
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
