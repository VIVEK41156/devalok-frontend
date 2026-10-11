"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Check, ImagePlus, Search, Upload, X } from "lucide-react";
import { api, ApiError, type Media, type Paginated } from "@/lib/admin-api";
import { imageSrc } from "@/lib/api-config";
import { Button, EmptyState, ErrorState, LoadingState, Modal, Pagination, useToast } from "./ui";
import { useApi } from "./useApi";

const ACCEPT = "image/jpeg,image/png,image/webp";
const MAX_MB = 8;

/** Client-side pre-checks; the server re-validates file content. */
export function checkFiles(files: File[]): string | null {
  for (const f of files) {
    if (!ACCEPT.split(",").includes(f.type)) return `${f.name}: only JPEG, PNG or WebP images are allowed.`;
    if (f.size > MAX_MB * 1024 * 1024) return `${f.name}: larger than ${MAX_MB} MB.`;
  }
  return null;
}

export async function uploadFiles(files: File[]): Promise<Media[]> {
  const form = new FormData();
  files.forEach((f) => form.append("files[]", f));
  const res = await api.upload<{ data: Media[] }>("/admin/media", form);
  return res.data;
}

export function Thumb({ media, className = "" }: { media: Media | null | undefined; className?: string }) {
  if (!media) {
    return <div className={`flex items-center justify-center bg-lavender/60 text-plum/40 ${className}`}><ImagePlus size={20} /></div>;
  }
  return (
    <div className={`relative overflow-hidden bg-lavender/40 ${className}`}>
      <Image src={imageSrc(media.url)} alt={media.alt ?? ""} fill sizes="200px" className="object-cover" />
    </div>
  );
}

/** Library browser + uploader. multiple=true returns several selections. */
export function MediaPickerModal({
  open,
  onClose,
  onSelect,
  multiple = false,
  title = "Choose an image",
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (media: Media[]) => void;
  multiple?: boolean;
  title?: string;
}) {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Media[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const list = useApi(() => (open ? api.get<Paginated<Media>>("/admin/media", { search, page, per_page: 24 }) : Promise.resolve(null)), [open, search, page]);

  const toggle = (m: Media) => {
    if (!multiple) {
      setSelected([m]);
      return;
    }
    setSelected((s) => (s.some((x) => x.id === m.id) ? s.filter((x) => x.id !== m.id) : [...s, m]));
  };

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const arr = Array.from(files);
    const problem = checkFiles(arr);
    if (problem) {
      toast({ tone: "error", message: problem });
      return;
    }
    setUploading(true);
    try {
      const created = await uploadFiles(arr);
      toast({ tone: "success", message: `Uploaded ${created.length} image(s).` });
      setSelected((s) => (multiple ? [...s, ...created] : created.slice(0, 1)));
      setPage(1);
      await list.reload();
    } catch (e) {
      toast({ tone: "error", message: e instanceof ApiError ? (Object.values(e.errors)[0]?.[0] ?? e.message) : "Upload failed." });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const close = () => {
    setSelected([]);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={title}
      wide
      footer={
        <>
          <span className="mr-auto self-center text-sm text-mist">{selected.length ? `${selected.length} selected` : "Nothing selected"}</span>
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button
            disabled={!selected.length}
            onClick={() => {
              onSelect(selected);
              close();
            }}
          >
            Use {multiple ? "selected" : "image"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-mist" />
          <span className="sr-only">Search images</span>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by title or file name"
            className="w-full rounded-md border border-plum/20 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/25"
          />
        </label>
        <input ref={fileRef} type="file" accept={ACCEPT} multiple className="hidden" onChange={(e) => void onFiles(e.target.files)} />
        <Button variant="gold" icon={<Upload size={16} />} loading={uploading} onClick={() => fileRef.current?.click()}>
          Upload images
        </Button>
      </div>
      <p className="mt-2 text-xs text-mist">JPEG, PNG or WebP · up to {MAX_MB} MB each · large images are resized to 2400 px automatically.</p>

      <div className="mt-4">
        {list.loading && !list.data ? (
          <LoadingState />
        ) : list.error ? (
          <ErrorState message={list.error} onRetry={list.reload} />
        ) : !list.data?.data.length ? (
          <EmptyState title="No images yet" description="Upload your first image to get started." />
        ) : (
          <>
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {list.data.data.map((m) => {
                const on = selected.some((s) => s.id === m.id);
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => toggle(m)}
                      aria-pressed={on}
                      className={`group relative block w-full overflow-hidden rounded-md ring-2 transition ${on ? "ring-gold" : "ring-transparent hover:ring-lilac"}`}
                    >
                      <Thumb media={m} className="aspect-square" />
                      {on && (
                        <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-gold text-plum-deep">
                          <Check size={14} />
                        </span>
                      )}
                      <span className="block truncate bg-white px-1.5 py-1 text-left text-[11px] text-plum/70">{m.title || m.original_name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="mt-3">
              <Pagination meta={list.data.meta} onPage={setPage} />
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

/** A single-image field: preview + choose/remove. */
export function ImageField({ label, media, onChange, hint }: { label: string; media: Media | null; onChange: (m: Media | null) => void; hint?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold text-plum">{label}</p>
      <div className="flex items-start gap-4">
        <Thumb media={media} className="h-28 w-24 shrink-0 rounded-md ring-1 ring-gold/25" />
        <div className="flex flex-col gap-2">
          <Button type="button" variant="outline" icon={<ImagePlus size={16} />} onClick={() => setOpen(true)}>
            {media ? "Change image" : "Choose image"}
          </Button>
          {media && (
            <Button type="button" variant="ghost" icon={<X size={16} />} onClick={() => onChange(null)}>
              Remove
            </Button>
          )}
          {hint && <p className="max-w-xs text-xs text-mist">{hint}</p>}
        </div>
      </div>
      <MediaPickerModal open={open} onClose={() => setOpen(false)} onSelect={(m) => onChange(m[0] ?? null)} title={label} />
    </div>
  );
}
