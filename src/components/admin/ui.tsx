"use client";

import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Inbox, Loader2, X } from "lucide-react";

// ── Buttons ────────────────────────────────────────────────────────────────
type BtnVariant = "primary" | "gold" | "outline" | "ghost" | "danger";
const BTN: Record<BtnVariant, string> = {
  primary: "bg-plum text-ivory hover:bg-plum-soft",
  gold: "bg-gold text-plum-deep hover:bg-gold-soft",
  outline: "border border-plum/20 bg-white text-plum hover:border-gold hover:bg-lavender/40",
  ghost: "text-plum/70 hover:bg-lavender/60 hover:text-plum",
  danger: "bg-red-700 text-white hover:bg-red-800",
};

export function Button({
  variant = "primary",
  loading,
  icon,
  className = "",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; loading?: boolean; icon?: ReactNode }) {
  return (
    <button
      {...rest}
      // Default to a plain button so buttons inside forms (or modals rendered within them) never submit by accident.
      type={rest.type ?? "button"}
      disabled={rest.disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${BTN[variant]} ${className}`}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : icon}
      {children}
    </button>
  );
}

export function LinkButton({ href, variant = "primary", icon, children, className = "" }: { href: string; variant?: BtnVariant; icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition-colors ${BTN[variant]} ${className}`}>
      {icon}
      {children}
    </Link>
  );
}

// ── Layout pieces ──────────────────────────────────────────────────────────
export function Card({ title, actions, children, className = "", padded = true }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; padded?: boolean }) {
  return (
    <section className={`rounded-xl border border-gold/25 bg-white shadow-[0_1px_2px_rgba(48,35,59,0.04),0_12px_32px_-24px_rgba(48,35,59,0.35)] ${className}`}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gold/15 px-5 py-4">
          {title && <h2 className="font-display text-xl font-semibold text-plum">{title}</h2>}
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={padded ? "p-5" : ""}>{children}</div>
    </section>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-3xl font-semibold text-plum sm:text-4xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-mist">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "success" | "warning" | "gold" | "info" | "danger"; children: ReactNode }) {
  const t = {
    neutral: "bg-plum/5 text-plum/70 ring-plum/10",
    success: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    warning: "bg-amber-50 text-amber-800 ring-amber-200",
    gold: "bg-gold/15 text-gold-deep ring-gold/30",
    info: "bg-lavender text-plum ring-lilac",
    danger: "bg-red-50 text-red-800 ring-red-200",
  }[tone];
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${t}`}>{children}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  if (status === "published") return <Badge tone="success">Published</Badge>;
  if (status === "draft") return <Badge tone="warning">Draft</Badge>;
  if (status === "new") return <Badge tone="info">New</Badge>;
  if (status === "in_progress") return <Badge tone="gold">In progress</Badge>;
  if (status === "resolved") return <Badge tone="success">Resolved</Badge>;
  return <Badge>{status}</Badge>;
}

// ── States ─────────────────────────────────────────────────────────────────
export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-16 text-sm text-mist">
      <Loader2 size={18} className="animate-spin text-gold" /> {label}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-lg border border-red-200 bg-red-50/60 px-6 py-10 text-center">
      <AlertTriangle className="text-red-700" />
      <p className="max-w-md text-sm text-red-900">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-lavender text-plum">
        <Inbox size={20} />
      </span>
      <p className="font-display text-xl text-plum">{title}</p>
      {description && <p className="max-w-sm text-sm text-mist">{description}</p>}
      {action}
    </div>
  );
}

// ── Form fields ────────────────────────────────────────────────────────────
function FieldShell({ id, label, hint, error, required, children, counter }: { id: string; label: string; hint?: ReactNode; error?: string; required?: boolean; children: ReactNode; counter?: string }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-semibold text-plum">
          {label} {required && <span className="text-gold-deep">*</span>}
        </label>
        {counter && <span className="text-xs text-mist">{counter}</span>}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-red-700">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-mist">{hint}</p>
      ) : null}
    </div>
  );
}

const INPUT =
  "w-full rounded-md border bg-white px-3 py-2.5 text-sm text-plum placeholder:text-mist/70 outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/25 disabled:bg-parchment";

export function TextField({ label, hint, error, maxLength, value, ...rest }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: ReactNode; error?: string }) {
  const id = useId();
  const len = typeof value === "string" ? value.length : 0;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={rest.required} counter={maxLength ? `${len}/${maxLength}` : undefined}>
      <input id={id} value={value ?? ""} maxLength={maxLength} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} {...rest} className={`${INPUT} ${error ? "border-red-400" : "border-plum/20"}`} />
    </FieldShell>
  );
}

export function TextArea({ label, hint, error, maxLength, value, rows = 4, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: ReactNode; error?: string }) {
  const id = useId();
  const len = typeof value === "string" ? value.length : 0;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={rest.required} counter={maxLength ? `${len}/${maxLength}` : undefined}>
      <textarea id={id} rows={rows} value={value ?? ""} maxLength={maxLength} aria-invalid={!!error} {...rest} className={`${INPUT} resize-y ${error ? "border-red-400" : "border-plum/20"}`} />
    </FieldShell>
  );
}

export function SelectField({ label, hint, error, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { label: string; hint?: ReactNode; error?: string }) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={rest.required}>
      <select id={id} aria-invalid={!!error} {...rest} className={`${INPUT} ${error ? "border-red-400" : "border-plum/20"}`}>
        {children}
      </select>
    </FieldShell>
  );
}

export function Toggle({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-plum" : "bg-plum/20"}`}
      >
        <span className={`absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
      <label htmlFor={id} className="cursor-pointer">
        <span className="block text-sm font-semibold text-plum">{label}</span>
        {hint && <span className="block text-xs text-mist">{hint}</span>}
      </label>
    </div>
  );
}

// ── Pagination ─────────────────────────────────────────────────────────────
export function Pagination({ meta, onPage }: { meta: { current_page: number; last_page: number; total: number; from: number | null; to: number | null }; onPage: (p: number) => void }) {
  if (meta.total === 0) return null;
  return (
    <div className="flex items-center justify-between gap-3 border-t border-gold/15 px-5 py-3 text-sm text-mist">
      <span>
        {meta.from}–{meta.to} of {meta.total}
      </span>
      <div className="flex items-center gap-1">
        <Button variant="ghost" aria-label="Previous page" disabled={meta.current_page <= 1} onClick={() => onPage(meta.current_page - 1)} icon={<ChevronLeft size={16} />} />
        <span className="px-2 text-plum">
          {meta.current_page} / {meta.last_page}
        </span>
        <Button variant="ghost" aria-label="Next page" disabled={meta.current_page >= meta.last_page} onClick={() => onPage(meta.current_page + 1)} icon={<ChevronRight size={16} />} />
      </div>
    </div>
  );
}

// ── Modal / confirm ────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [open, onClose]);
  if (!open || typeof document === "undefined") return null;
  // Portalled to <body> so a modal opened from inside a <form> is not part of that form.
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-plum-deep/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-ivory shadow-2xl outline-none sm:rounded-2xl ${wide ? "sm:max-w-5xl" : "sm:max-w-lg"}`}
      >
        <header className="flex items-center justify-between border-b border-gold/20 px-5 py-4">
          <h2 className="font-display text-2xl font-semibold text-plum">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1.5 text-plum/60 hover:bg-lavender hover:text-plum">
            <X size={18} />
          </button>
        </header>
        <div className="overflow-y-auto p-5">{children}</div>
        {footer && <footer className="flex flex-wrap justify-end gap-2 border-t border-gold/20 px-5 py-4">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}

type ConfirmOpts = { title: string; message: ReactNode; confirmLabel?: string; danger?: boolean };
const ConfirmCtx = createContext<(o: ConfirmOpts) => Promise<boolean>>(() => Promise.resolve(false));
const ToastCtx = createContext<(t: { tone: "success" | "error"; message: string }) => void>(() => {});

export const useConfirm = () => useContext(ConfirmCtx);
export const useToast = () => useContext(ToastCtx);

export function AdminFeedbackProvider({ children }: { children: ReactNode }) {
  const [confirmState, setConfirmState] = useState<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null);
  const [toasts, setToasts] = useState<{ id: number; tone: "success" | "error"; message: string }[]>([]);

  const confirm = useCallback((o: ConfirmOpts) => new Promise<boolean>((resolve) => setConfirmState({ ...o, resolve })), []);
  const toast = useCallback((t: { tone: "success" | "error"; message: string }) => {
    const id = Date.now() + Math.random();
    setToasts((ts) => [...ts, { id, ...t }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 4500);
  }, []);
  const close = (v: boolean) => {
    confirmState?.resolve(v);
    setConfirmState(null);
  };

  return (
    <ConfirmCtx.Provider value={confirm}>
      <ToastCtx.Provider value={toast}>
        {children}
        <Modal
          open={!!confirmState}
          onClose={() => close(false)}
          title={confirmState?.title ?? ""}
          footer={
            <>
              <Button variant="outline" onClick={() => close(false)}>
                Cancel
              </Button>
              <Button variant={confirmState?.danger ? "danger" : "primary"} onClick={() => close(true)}>
                {confirmState?.confirmLabel ?? "Confirm"}
              </Button>
            </>
          }
        >
          <div className="text-sm text-plum/80">{confirmState?.message}</div>
        </Modal>
        <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-[90] flex w-[min(92vw,380px)] flex-col gap-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg ${t.tone === "success" ? "border-emerald-200 bg-white text-emerald-900" : "border-red-200 bg-white text-red-900"}`}
            >
              {t.tone === "success" ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" /> : <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-600" />}
              {t.message}
            </div>
          ))}
        </div>
      </ToastCtx.Provider>
    </ConfirmCtx.Provider>
  );
}

export function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function formatBytes(n?: number) {
  if (!n) return "—";
  return n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`;
}
