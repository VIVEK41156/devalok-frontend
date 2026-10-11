"use client";

import { useState } from "react";
import { CheckCircle2, Info, KeyRound, Mail, PlugZap, Trash2, XCircle } from "lucide-react";
import { api, ApiError } from "@/lib/admin-api";
import { useAuth } from "@/components/admin/AuthProvider";
import { Badge, Button, Card, EmptyState, ErrorState, LoadingState, PageHeader, SelectField, TextField, formatDate, useConfirm, useToast } from "@/components/admin/ui";
import { useApi } from "@/components/admin/useApi";

interface SmtpState {
  active: boolean;
  host: string;
  port: number;
  encryption: "tls" | "ssl";
  username: string | null;
  from_name: string;
  recipient: string | null;
  has_password: boolean;
  last_error: string | null;
  tested_at: string | null;
}

function Form({ initial, onSaved }: { initial: SmtpState; onSaved: (s: SmtpState) => void }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [f, setF] = useState({
    username: initial.username ?? "",
    password: "",
    host: initial.host || "smtp.gmail.com",
    port: String(initial.port || 587),
    encryption: initial.encryption || "tls",
    from_name: initial.from_name || "Devalok Sculptures",
    recipient: initial.recipient ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));

  const configure = async () => {
    setBusy(true);
    setResult(null);
    setErrors({});
    try {
      const res = await api.put<{ message: string; data: SmtpState }>("/admin/smtp", {
        username: f.username.trim(),
        password: f.password || null,
        host: f.host.trim() || "smtp.gmail.com",
        port: Number(f.port) || 587,
        encryption: f.encryption,
        from_name: f.from_name.trim() || null,
        recipient: f.recipient.trim() || null,
      });
      setResult({ ok: true, message: res.message });
      toast({ tone: "success", message: "SMTP configured and test email sent." });
      setF((x) => ({ ...x, password: "" }));
      onSaved(res.data);
    } catch (e) {
      const err = e instanceof ApiError ? e : null;
      const fields: Record<string, string> = {};
      for (const [k, v] of Object.entries(err?.errors ?? {})) fields[k] = v[0];
      setErrors(fields);
      setResult({ ok: false, message: err?.message ?? "Configuration failed." });
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    if (!(await confirm({ title: "Disable email notifications?", message: "The saved email address and app password will be removed. Enquiries will still be saved in the admin panel.", confirmLabel: "Disable", danger: true }))) return;
    try {
      const res = await api.del<{ data: SmtpState }>("/admin/smtp");
      toast({ tone: "success", message: "SMTP disabled." });
      setF((x) => ({ ...x, username: "", password: "", recipient: "" }));
      setResult(null);
      onSaved(res.data);
    } catch (e) {
      toast({ tone: "error", message: e instanceof ApiError ? e.message : "Could not disable SMTP." });
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <Card title="Mail account">
        <div className="grid gap-5 md:grid-cols-2">
          <TextField label="Email address" required type="email" autoComplete="off" value={f.username} onChange={(e) => set("username", e.target.value)} error={errors.username} hint="The mailbox that sends the notifications, e.g. yourname@gmail.com" />
          <TextField
            label="App password"
            required={!initial.has_password}
            type="password"
            autoComplete="new-password"
            value={f.password}
            onChange={(e) => set("password", e.target.value)}
            error={errors.password}
            placeholder={initial.has_password ? "•••••••• saved — leave blank to keep" : "16-character app password"}
            hint="Stored encrypted and never shown again."
          />
          <div className="md:col-span-2">
            <TextField label="Send enquiries to" value={f.recipient} onChange={(e) => set("recipient", e.target.value)} error={errors.recipient} hint="Where the client receives query details. Separate several addresses with commas. Defaults to the email address above." />
          </div>
          <TextField label="Sender name" maxLength={120} value={f.from_name} onChange={(e) => set("from_name", e.target.value)} />
          <div className="grid grid-cols-[1fr_110px_120px] gap-3 md:col-span-2">
            <TextField label="SMTP host" value={f.host} onChange={(e) => set("host", e.target.value)} error={errors.host} />
            <SelectField label="Port" value={f.port} onChange={(e) => set("port", e.target.value)} error={errors.port}>
              <option value="587">587</option>
              <option value="465">465</option>
              <option value="2525">2525</option>
              <option value="25">25</option>
            </SelectField>
            <SelectField label="Security" value={f.encryption} onChange={(e) => set("encryption", e.target.value as "tls" | "ssl")}>
              <option value="tls">TLS</option>
              <option value="ssl">SSL</option>
            </SelectField>
          </div>
        </div>

        {result && (
          <div role="status" className={`mt-6 flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${result.ok ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-900"}`}>
            {result.ok ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> : <XCircle size={18} className="mt-0.5 shrink-0" />}
            {result.message}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          <Button loading={busy} icon={<PlugZap size={16} />} onClick={() => void configure()}>
            {busy ? "Testing connection…" : "Configure & send test email"}
          </Button>
          {(initial.active || initial.has_password) && (
            <Button variant="outline" icon={<Trash2 size={16} className="text-red-700" />} onClick={() => void disable()}>
              Disable
            </Button>
          )}
        </div>
      </Card>

      <div className="flex flex-col gap-6">
        <Card title="Status">
          <div className="space-y-3 text-sm">
            <p className="flex items-center gap-2">
              {initial.active ? <Badge tone="success">Active — enquiries are emailed</Badge> : <Badge tone="warning">Not configured</Badge>}
            </p>
            {initial.active && (
              <p className="text-plum/80">
                Sending as <strong>{initial.username}</strong> to <strong>{initial.recipient}</strong>
              </p>
            )}
            {initial.tested_at && <p className="text-xs text-mist">Last test: {formatDate(initial.tested_at)}</p>}
            {initial.last_error && <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-800">{initial.last_error}</p>}
          </div>
        </Card>
        <Card title="Gmail app password">
          <ol className="list-decimal space-y-2 pl-4 text-sm text-plum/80">
            <li>Turn on 2-Step Verification for the Google account.</li>
            <li>
              Open <strong>Google Account → Security → App passwords</strong>.
            </li>
            <li>Create one named “Devalok website” and copy the 16-character code.</li>
            <li>Paste it above with the Gmail address and click Configure.</li>
          </ol>
          <p className="mt-3 flex items-start gap-2 text-xs text-mist">
            <Info size={14} className="mt-0.5 shrink-0" /> Your normal Gmail password will not work. Other providers (Zoho, Outlook, Hostinger mail) work too; just change the host and port.
          </p>
        </Card>
      </div>
    </div>
  );
}

export default function SmtpPage() {
  const { user } = useAuth();
  const res = useApi(() => (user?.role === "admin" ? api.get<{ data: SmtpState }>("/admin/smtp").then((r) => r.data) : Promise.resolve(null)), [user?.role]);

  if (user?.role !== "admin") {
    return (
      <>
        <PageHeader title="SMTP / Email" />
        <EmptyState title="Administrators only" description="Ask an administrator to configure email notifications." />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="SMTP / Email"
        description={
          <span className="inline-flex items-center gap-1.5">
            <Mail size={14} /> When configured, every contact-form enquiry is emailed to you with the visitor&rsquo;s details. Replying to that email answers the visitor directly.
          </span>
        }
        actions={<KeyRound className="text-gold-deep" size={20} aria-hidden />}
      />
      {res.loading && !res.data ? <LoadingState /> : res.error ? <ErrorState message={res.error} onRetry={res.reload} /> : res.data ? <Form key={String(res.data.tested_at)} initial={res.data} onSaved={(s) => res.setData(s)} /> : null}
    </>
  );
}
