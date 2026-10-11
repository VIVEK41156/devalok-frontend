// Contact submission boundary: the public form only talks to this module,
// which posts to the Laravel API (POST /api/v1/contact-enquiries).

import { API_BASE_URL, API_CONFIGURED, API_ORIGIN } from "./api-config";

export interface EnquiryInput {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export type EnquiryErrors = Partial<Record<keyof EnquiryInput | "form", string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Client-side checks for fast feedback; the server validates again. */
export function validateEnquiry(input: EnquiryInput): EnquiryErrors {
  const errors: EnquiryErrors = {};
  if (input.name.trim().length < 2) errors.name = "Please tell us your name.";
  if (!input.email.trim()) errors.email = "Please enter your email address.";
  else if (!EMAIL_RE.test(input.email.trim())) errors.email = "That email address doesn't look quite right.";
  if (input.phone.trim() && !/^[0-9+()\-\s]{6,40}$/.test(input.phone.trim())) errors.phone = "Please enter a valid phone number.";
  if (!input.subject.trim()) errors.subject = "Please add a subject.";
  if (input.message.trim().length < 10) errors.message = "Please write a short message (at least 10 characters).";
  return errors;
}

export type EnquiryResult = { ok: true } | { ok: false; errors: EnquiryErrors };

function readCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

export async function submitEnquiry(input: EnquiryInput & { sculpture?: string; website?: string }): Promise<EnquiryResult> {
  if (!API_CONFIGURED) {
    // Preview deployment without the backend: be honest that nothing is sent.
    return { ok: false, errors: { form: "This is a preview of the new website and the enquiry form isn't connected yet. Please call or email us using the details on this page." } };
  }
  try {
    // The website is a Sanctum "stateful" origin, so POSTs carry a CSRF token like the admin panel does.
    await fetch(`${API_ORIGIN}/sanctum/csrf-cookie`, { credentials: "include" });
    const xsrf = readCookie("XSRF-TOKEN");
    const res = await fetch(`${API_BASE_URL}/contact-enquiries`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", Accept: "application/json", ...(xsrf ? { "X-XSRF-TOKEN": xsrf } : {}) },
      body: JSON.stringify({ ...input, phone: input.phone || null }),
    });
    if (res.status === 201) return { ok: true };
    if (res.status === 422) {
      const body = (await res.json()) as { errors?: Record<string, string[]> };
      const errors: EnquiryErrors = {};
      for (const [k, v] of Object.entries(body.errors ?? {})) {
        const key = (["name", "email", "phone", "subject", "message"].includes(k) ? k : "form") as keyof EnquiryErrors;
        errors[key] = v[0];
      }
      return { ok: false, errors };
    }
    if (res.status === 429) return { ok: false, errors: { form: "Too many enquiries from this connection. Please try again in a few minutes." } };
    return { ok: false, errors: { form: "We couldn't send your enquiry just now. Please try again, or call or email us directly." } };
  } catch {
    return { ok: false, errors: { form: "We couldn't reach the server. Please check your connection and try again." } };
  }
}
