"use client";

import { useRef, useState, type DragEvent } from "react";
import Image from "next/image";
import { RefreshCw, Save, Search, Trash2, Upload } from "lucide-react";
import { api, ApiError, type Media, type Paginated } from "@/lib/admin-api";
import { imageSrc } from "@/lib/api-config";
import { refreshPublicSite } from "@/app/admin/actions";
import { Badge, Button, Card, EmptyState, ErrorState, LoadingState, PageHeader, Pagination, TextArea, TextField, formatBytes, formatDate, useConfirm, useToast } from "@/components/admin/ui";
import { Thumb, checkFiles, uploadFiles } from "@/components/admin/MediaPicker";
import { saveErrors, useApi } from "@/components/admin/useApi";

export default function MediaLibraryPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);

  const list = useApi(() => api.get<Paginated<Media>>("/admin/media", { search, page, per_page: 30 }), [search, page]);
  const detail = useApi(() => (selectedId ? api.get<{ data: Media }>(`/admin/media/${selectedId}`).then((r) => r.data) : Promise.resolve(null)), [selectedId]);
  const [meta, setMeta] = useState<{ id: number; title: string; alt: string; caption: string } | null>(null);
  const editing = detail.data && meta?.id === detail.data.id ? meta : detail.data ? { id: detail.data.id, title: detail.data.title ?? "", alt: detail.data.alt ?? "", caption: detail.data.caption ?? "" } : null;
  const [saving, setSaving] = useState(false);

  const upload = async (files: File[]) => {
    if (!files.length) return;
    const problem = checkFiles(files);
    if (problem) {
      toast({ tone: "error", message: problem });
      return;
    }
    setUploading(true);
    try {
      const created = await uploadFiles(files);
      toast({ tone: "success", message: `Uploaded ${created.length} image(s). Add alt text so they're accessible.` });
      setPage(1);
      await list.reload();
      setSelectedId(created[0]?.id ?? null);
    } catch (e) {
      toast({ tone: "error", message: e instanceof ApiError ? (Object.values(e.errors)[0]?.[0] ?? e.message) : "Upload failed." });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    void upload(Array.from(e.dataTransfer.files));
  };

  const saveMeta = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await api.put(`/admin/media/${editing.id}`, { title: editing.title || null, alt: editing.alt || null, caption: editing.caption || null });
      await refreshPublicSite();
      toast({ tone: "success", message: "Image details saved." });
      await Promise.all([detail.reload(), list.reload()]);
    } catch (e) {
      toast({ tone: "error", message: saveErrors(e).message });
    } finally {
      setSaving(false);
    }
  };

  const replace = async (file: File | undefined) => {
    if (!file || !detail.data) return;
    const problem = checkFiles([file]);
    if (problem) {
      toast({ tone: "error", message: problem });
      return;
    }
    const ok = await confirm({ title: "Replace image file?", message: "The new file will appear everywhere this image is used. The old file is deleted.", confirmLabel: "Replace" });
    if (!ok) return;
    const form = new FormData();
    form.append("file", file);
    try {
      await api.upload(`/admin/media/${detail.data.id}/replace`, form);
      await refreshPublicSite();
      toast({ tone: "success", message: "Image replaced." });
      await Promise.all([detail.reload(), list.reload()]);
    } catch (e) {
      toast({ tone: "error", message: e instanceof ApiError ? (Object.values(e.errors)[0]?.[0] ?? e.message) : "Replace failed." });
    } finally {
      if (replaceRef.current) replaceRef.current.value = "";
    }
  };

  const remove = async () => {
    const m = detail.data;
    if (!m) return;
    const ok = await confirm({ title: "Delete image?", message: "The file is removed from the server permanently.", confirmLabel: "Delete", danger: true });
    if (!ok) return;
    try {
      await api.del(`/admin/media/${m.id}`);
      toast({ tone: "success", message: "Image deleted." });
      setSelectedId(null);
      await list.reload();
    } catch (e) {
      const { fields, message } = saveErrors(e);
      toast({ tone: "error", message: fields.media ?? message });
    }
  };

  const m = detail.data;
  const inUse = !!m?.usage?.length;

  return (
    <>
      <PageHeader
        title="Gallery & Media"
        description="Every image used on the website. Files are checked and re-encoded on upload; only JPEG, PNG and WebP are accepted."
        actions={
          <>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => void upload(Array.from(e.target.files ?? []))} />
            <Button variant="gold" icon={<Upload size={16} />} loading={uploading} onClick={() => fileRef.current?.click()}>
              Upload images
            </Button>
          </>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card padded={false}>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`m-4 rounded-lg border-2 border-dashed px-4 py-5 text-center text-sm transition ${dragOver ? "border-gold bg-gold/10 text-plum" : "border-plum/15 text-mist"}`}
          >
            Drag and drop images here, or use <strong className="text-plum">Upload images</strong>. Up to 8 MB each.
          </div>
          <div className="px-4">
            <label className="relative block">
              <span className="sr-only">Search images</span>
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-mist" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by title, file name or alt text"
                className="w-full rounded-md border border-plum/20 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/25"
              />
            </label>
          </div>
          <div className="p-4">
            {list.loading && !list.data ? (
              <LoadingState />
            ) : list.error ? (
              <ErrorState message={list.error} onRetry={list.reload} />
            ) : !list.data?.data.length ? (
              <EmptyState title={search ? "No images match" : "The library is empty"} />
            ) : (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {list.data.data.map((x) => (
                  <li key={x.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(x.id)}
                      aria-pressed={selectedId === x.id}
                      className={`block w-full overflow-hidden rounded-md bg-white text-left ring-2 transition ${selectedId === x.id ? "ring-gold" : "ring-transparent hover:ring-lilac"}`}
                    >
                      <Thumb media={x} className="aspect-square" />
                      <span className="block truncate px-2 py-1.5 text-xs text-plum/80">{x.title || x.original_name}</span>
                      {!x.alt && <span className="block px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700">No alt text</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {list.data && <Pagination meta={list.data.meta} onPage={setPage} />}
        </Card>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          <Card title="Image details">
            {!selectedId ? (
              <p className="text-sm text-mist">Select an image to edit its alt text, caption or file.</p>
            ) : detail.loading && !m ? (
              <LoadingState />
            ) : detail.error ? (
              <ErrorState message={detail.error} onRetry={detail.reload} />
            ) : m && editing ? (
              <div className="space-y-4">
                <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-lavender/40">
                  <Image src={imageSrc(m.url)} alt={m.alt ?? ""} fill sizes="380px" className="object-contain" />
                </div>
                <dl className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <dt className="text-mist">Dimensions</dt>
                    <dd className="text-plum">{m.width && m.height ? `${m.width} × ${m.height}` : "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-mist">Size</dt>
                    <dd className="text-plum">{formatBytes(m.size)}</dd>
                  </div>
                  <div>
                    <dt className="text-mist">Type</dt>
                    <dd className="text-plum">{m.mime}</dd>
                  </div>
                  <div>
                    <dt className="text-mist">Uploaded</dt>
                    <dd className="text-plum">{formatDate(m.created_at)}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-mist">Original file</dt>
                    <dd className="truncate text-plum">{m.original_name}</dd>
                  </div>
                </dl>
                <TextField label="Title" maxLength={160} value={editing.title} onChange={(e) => setMeta({ ...editing, title: e.target.value })} />
                <TextField label="Alt text" maxLength={255} value={editing.alt} onChange={(e) => setMeta({ ...editing, alt: e.target.value })} hint="Describe the image for screen readers and search engines." />
                <TextArea label="Caption" maxLength={500} rows={2} value={editing.caption} onChange={(e) => setMeta({ ...editing, caption: e.target.value })} />
                <div className="flex flex-wrap gap-2">
                  <Button loading={saving} icon={<Save size={16} />} onClick={() => void saveMeta()}>
                    Save details
                  </Button>
                  <input ref={replaceRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => void replace(e.target.files?.[0])} />
                  <Button variant="outline" icon={<RefreshCw size={16} />} onClick={() => replaceRef.current?.click()}>
                    Replace file
                  </Button>
                </div>
                <div className="border-t border-gold/15 pt-4">
                  <p className="text-sm font-semibold text-plum">Used in</p>
                  {inUse ? (
                    <ul className="mt-2 space-y-1 text-sm">
                      {m.usage!.map((u, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Badge tone="info">{u.type.replace("-", " ")}</Badge>
                          <span className="truncate text-plum/80">{u.label ?? "—"}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-sm text-mist">Not used anywhere.</p>
                  )}
                </div>
                <Button variant="outline" disabled={inUse} icon={<Trash2 size={16} className="text-red-700" />} onClick={() => void remove()} title={inUse ? "Remove it from the items above first" : undefined}>
                  {inUse ? "In use — cannot delete" : "Delete image"}
                </Button>
              </div>
            ) : null}
          </Card>
        </aside>
      </div>
    </>
  );
}
