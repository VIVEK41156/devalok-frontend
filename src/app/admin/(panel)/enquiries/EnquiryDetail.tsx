"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, Inbox, Mail, Phone, Trash2 } from "lucide-react";
import { api } from "@/lib/admin-api";
import { saveErrors } from "@/components/admin/useApi";
import { Button, Modal, StatusBadge, formatDate, useConfirm, useToast } from "@/components/admin/ui";

export type EnquiryStatus = "new" | "in_progress" | "resolved";

/** Mirrors EnquiryResource. */
export interface Enquiry {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: EnquiryStatus;
  sculpture: { id: number; title: string; slug: string } | null;
  handled_by: string | null;
  created_at: string | null;
  updated_at?: string | null;
}

export const STATUS_OPTIONS: { value: EnquiryStatus; label: string; icon: typeof Inbox }[] = [
  { value: "new", label: "New", icon: Inbox },
  { value: "in_progress", label: "In progress", icon: Clock },
  { value: "resolved", label: "Resolved", icon: CheckCircle2 },
];

function replyHref(e: Enquiry) {
  const subject = `Re: ${e.subject?.trim() || "Your enquiry to Devalok Sculptures"}`;
  return `mailto:${encodeURIComponent(e.email)}?subject=${encodeURIComponent(subject)}`;
}

export default function EnquiryDetail({
  enquiry,
  onClose,
  onUpdated,
  onDeleted,
}: {
  enquiry: Enquiry;
  onClose: () => void;
  onUpdated: (e: Enquiry) => void;
  onDeleted: (id: number) => void;
}) {
  const confirm = useConfirm();
  const toast = useToast();
  const [busy, setBusy] = useState<EnquiryStatus | "delete" | null>(null);

  const setStatus = async (status: EnquiryStatus) => {
    if (status === enquiry.status) return;
    setBusy(status);
    try {
      const res = await api.put<{ data: Enquiry }>(`/admin/enquiries/${enquiry.id}`, { status });
      onUpdated(res.data);
      toast({ tone: "success", message: `Marked as ${STATUS_OPTIONS.find((s) => s.value === status)?.label.toLowerCase()}.` });
    } catch (e) {
      const { fields, message } = saveErrors(e);
      toast({ tone: "error", message: fields.status ?? message });
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    const ok = await confirm({
      title: "Delete enquiry?",
      message: `The enquiry from ${enquiry.name} will be permanently deleted. This cannot be undone.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    setBusy("delete");
    try {
      await api.del(`/admin/enquiries/${enquiry.id}`);
      toast({ tone: "success", message: "Enquiry deleted." });
      onDeleted(enquiry.id);
    } catch (e) {
      toast({ tone: "error", message: saveErrors(e).message });
      setBusy(null);
    }
  };

  return (
    <Modal
      open
      wide
      onClose={onClose}
      title={`Enquiry #${enquiry.id}`}
      footer={
        <>
          <Button variant="danger" icon={<Trash2 size={16} />} loading={busy === "delete"} disabled={!!busy} onClick={remove} className="sm:mr-auto">
            Delete
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={enquiry.status} />
            <span className="text-xs text-mist">Received {formatDate(enquiry.created_at)}</span>
          </div>
          <h3 className="mt-3 break-words font-display text-2xl font-semibold text-plum">{enquiry.subject?.trim() || "(No subject)"}</h3>
          {enquiry.sculpture && (
            <p className="mt-1 text-sm text-mist">
              About{" "}
              <Link href={`/admin/sculptures/${enquiry.sculpture.id}`} className="font-semibold text-gold-deep underline-offset-2 hover:underline">
                {enquiry.sculpture.title}
              </Link>
            </p>
          )}
          {/* Visitor-supplied text: rendered as plain text only. */}
          <div className="mt-4 whitespace-pre-wrap break-words rounded-lg border border-gold/20 bg-white p-4 text-sm leading-relaxed text-plum/90">{enquiry.message}</div>
          <p className="mt-3 text-xs text-mist">Enquiries are stored here only — no email is sent automatically. Reply from your own mailbox.</p>
        </div>

        <aside className="space-y-5">
          <div className="rounded-lg border border-gold/20 bg-white p-4 text-sm">
            <p className="font-semibold text-plum">{enquiry.name}</p>
            <a href={replyHref(enquiry)} className="mt-2 flex items-center gap-2 break-all text-plum/80 hover:text-gold-deep">
              <Mail size={14} className="shrink-0 text-gold" /> {enquiry.email}
            </a>
            {enquiry.phone && (
              <a href={`tel:${enquiry.phone.replace(/[^\d+]/g, "")}`} className="mt-1.5 flex items-center gap-2 text-plum/80 hover:text-gold-deep">
                <Phone size={14} className="shrink-0 text-gold" /> {enquiry.phone}
              </a>
            )}
            <a
              href={replyHref(enquiry)}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-plum px-4 py-2.5 text-sm font-semibold text-ivory transition-colors hover:bg-plum-soft"
            >
              <Mail size={16} /> Reply by email
            </a>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-mist">Status</p>
            <div className="grid gap-2">
              {STATUS_OPTIONS.map(({ value, label, icon: Icon }) => {
                const current = enquiry.status === value;
                return (
                  <Button
                    key={value}
                    variant={current ? "primary" : "outline"}
                    aria-pressed={current}
                    icon={<Icon size={16} />}
                    loading={busy === value}
                    disabled={!!busy && busy !== value}
                    onClick={() => setStatus(value)}
                  >
                    {label}
                  </Button>
                );
              })}
            </div>
            {enquiry.handled_by && <p className="mt-2 text-xs text-mist">Last handled by {enquiry.handled_by}</p>}
          </div>
        </aside>
      </div>
    </Modal>
  );
}
