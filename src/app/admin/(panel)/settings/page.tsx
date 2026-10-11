"use client";

import { useState } from "react";
import { Lock, Save } from "lucide-react";
import { api, type Media } from "@/lib/admin-api";
import { refreshPublicSite } from "@/app/admin/actions";
import { useAuth } from "@/components/admin/AuthProvider";
import { Button, Card, EmptyState, ErrorState, LoadingState, PageHeader, TextArea, TextField, useToast } from "@/components/admin/ui";
import { ImageField } from "@/components/admin/MediaPicker";
import { saveErrors, useApi } from "@/components/admin/useApi";

interface Setting {
  key: string;
  value: string | null;
  type: "text" | "textarea" | "email" | "url" | "phone" | "media";
  group: string;
  is_public: boolean;
  media_url: string | null;
}

const LABELS: Record<string, [string, string?]> = {
  site_name: ["Site name"],
  tagline: ["Tagline"],
  site_description: ["Site description", "Used in the footer and as the fallback meta description."],
  logo_media_id: ["Logo"],
  favicon_media_id: ["Favicon", "Square PNG works best."],
  contact_email: ["Contact email"],
  contact_phone: ["Contact phone"],
  whatsapp_number: ["WhatsApp number", "Only add a verified number. The WhatsApp button appears on the Contact page once set."],
  address_line_1: ["Address line 1"],
  address_line_2: ["Address line 2"],
  address_line_3: ["Address line 3"],
  map_url: ["Map link", "Google Maps URL for the address."],
  social_instagram: ["Instagram URL"],
  social_facebook: ["Facebook URL"],
  social_youtube: ["YouTube URL"],
  social_x: ["X (Twitter) URL"],
  footer_text: ["Footer copyright text"],
  vision: ["Vision statement"],
  mission: ["Mission statement"],
  seo_default_title: ["Default SEO title", "Used on the homepage and wherever a page has no SEO title."],
  seo_title_template: ["Title template", "Use %s where the page title goes, e.g. “%s | Devalok Sculptures”."],
  seo_default_description: ["Default meta description"],
  seo_default_og_media_id: ["Default social share image"],
  enquiry_notification_email: ["Enquiry notification email (private)", "Stored for a future email integration. Never shown on the website. No emails are sent yet."],
};

const GROUPS: [string, string][] = [
  ["general", "General"],
  ["branding", "Branding"],
  ["contact", "Contact details"],
  ["social", "Social links"],
  ["brand", "Brand statements"],
  ["footer", "Footer"],
  ["seo", "Global SEO defaults"],
  ["private", "Private (admin only)"],
];

export default function SettingsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const res = useApi(() => (user?.role === "admin" ? api.get<{ data: Setting[] }>("/admin/settings").then((r) => r.data) : Promise.resolve([] as Setting[])), [user?.role]);
  const [values, setValues] = useState<Record<string, string | null> | null>(null);
  const [mediaPreview, setMediaPreview] = useState<Record<string, Media | null>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  if (user?.role !== "admin") {
    return (
      <>
        <PageHeader title="Site Settings" />
        <EmptyState title="Administrators only" description="Ask an administrator to change contact details, branding or global SEO." />
      </>
    );
  }

  const settings = res.data ?? [];
  const current = values ?? Object.fromEntries(settings.map((s) => [s.key, s.value]));
  const set = (k: string, v: string | null) => setValues({ ...current, [k]: v });
  const mediaFor = (s: Setting): Media | null => {
    if (s.key in mediaPreview) return mediaPreview[s.key];
    return s.value && s.media_url ? { id: Number(s.value), url: s.media_url, width: null, height: null, alt: null, caption: null } : null;
  };

  const save = async () => {
    setSaving(true);
    try {
      const r = await api.put<{ data: Setting[] }>("/admin/settings", { settings: current });
      res.setData(r.data);
      setValues(null);
      setMediaPreview({});
      setErrors({});
      await refreshPublicSite();
      toast({ tone: "success", message: "Settings saved. The website is updated." });
    } catch (e) {
      const { fields, message } = saveErrors(e);
      setErrors(Object.fromEntries(Object.entries(fields).map(([k, v]) => [k.replace(/^settings\./, ""), v])));
      toast({ tone: "error", message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Site Settings"
        description="Business details, branding and global SEO. Saved in the database and served to the website through a public endpoint that only includes public settings."
        actions={
          <Button loading={saving} icon={<Save size={16} />} onClick={() => void save()} disabled={!settings.length}>
            Save settings
          </Button>
        }
      />
      {res.loading && !res.data ? (
        <LoadingState />
      ) : res.error ? (
        <ErrorState message={res.error} onRetry={res.reload} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {GROUPS.map(([group, title]) => {
            const items = settings.filter((s) => s.group === group);
            if (!items.length) return null;
            return (
              <Card key={group} title={<span className="inline-flex items-center gap-2">{title}{group === "private" && <Lock size={14} className="text-mist" />}</span>}>
                <div className="space-y-4">
                  {items.map((s) => {
                    const [label, hint] = LABELS[s.key] ?? [s.key];
                    if (s.type === "media") {
                      return (
                        <ImageField
                          key={s.key}
                          label={label}
                          hint={hint}
                          media={mediaFor(s)}
                          onChange={(m) => {
                            setMediaPreview((p) => ({ ...p, [s.key]: m }));
                            set(s.key, m ? String(m.id) : null);
                          }}
                        />
                      );
                    }
                    const common = { label, hint, error: errors[s.key], value: current[s.key] ?? "" };
                    return s.type === "textarea" ? (
                      <TextArea key={s.key} {...common} rows={3} onChange={(e) => set(s.key, e.target.value)} />
                    ) : (
                      <TextField key={s.key} {...common} type={s.type === "email" ? "email" : s.type === "phone" ? "tel" : s.type === "url" ? "url" : "text"} onChange={(e) => set(s.key, e.target.value)} />
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
