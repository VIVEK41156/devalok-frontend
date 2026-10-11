"use client";

import { useId, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Info, Loader2, MessagesSquare, PhoneCall, Sparkles } from "lucide-react";
import { submitEnquiry, validateEnquiry, type EnquiryErrors, type EnquiryInput } from "@/lib/enquiry";
import { useSite } from "@/components/providers/SiteProvider";

const EMPTY: EnquiryInput = { name: "", email: "", phone: "", subject: "", message: "" };

// One-click subjects for the most common enquiries.
const TOPICS = ["Idol for a home shrine", "Temple installation", "A meaningful gift", "A piece from the gallery"];

const NEXT_STEPS = [
  { icon: MessagesSquare, title: "We read your enquiry", text: "Every message reaches the Devalok team directly." },
  { icon: Sparkles, title: "We share options", text: "Photos, sizes and materials that suit your space." },
  { icon: PhoneCall, title: "We talk it through", text: "By phone or email, or visit the workshop in Bengaluru." },
];

export function ContactFormFromParams() {
  const slug = useSearchParams().get("sculpture");
  const { getSculptureBySlug } = useSite();
  const sculpture = slug ? getSculptureBySlug(slug) : undefined;
  return <ContactForm key={sculpture?.id ?? "none"} sculptureSlug={sculpture?.slug} presetSubject={sculpture ? `Enquiry: ${sculpture.name}` : undefined} />;
}

export default function ContactForm({ presetSubject, sculptureSlug }: { presetSubject?: string; sculptureSlug?: string }) {
  const uid = useId();
  const [values, setValues] = useState<EnquiryInput>({ ...EMPTY, subject: presetSubject ?? "" });
  const [errors, setErrors] = useState<EnquiryErrors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  // Honeypot: hidden from people, often filled by bots; the API rejects it.
  const [website, setWebsite] = useState("");

  const set = (k: keyof EnquiryInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const next = { ...values, [k]: e.target.value };
    setValues(next);
    if (errors[k]) setErrors(validateEnquiry(next));
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const found = validateEnquiry(values);
    setErrors(found);
    const firstInvalid = (Object.keys(found) as (keyof EnquiryInput)[])[0];
    if (firstInvalid) {
      document.getElementById(`${uid}-${firstInvalid}`)?.focus();
      return;
    }
    setStatus("sending");
    const res = await submitEnquiry({ ...values, sculpture: sculptureSlug, website });
    if (res.ok) {
      setStatus("sent");
      return;
    }
    setErrors(res.errors);
    setStatus("idle");
  };

  const field = (k: keyof EnquiryInput, label: string, type: "text" | "email" | "tel" | "textarea" = "text", autoComplete?: string, required = true) => {
    const id = `${uid}-${k}`;
    const err = errors[k];
    const base =
      "peer w-full border-0 border-b bg-transparent px-0 pb-3 pt-7 text-lg text-plum placeholder-transparent outline-none transition-colors focus:border-gold focus:ring-0";
    const tone = err ? "border-red-700/70" : "border-plum/25";
    return (
      <div className="relative">
        {type === "textarea" ? (
          <textarea id={id} name={k} rows={5} value={values[k]} onChange={set(k)} placeholder={label} aria-invalid={!!err} aria-describedby={err ? `${id}-err` : undefined} required={required} className={`${base} ${tone} resize-none`} />
        ) : (
          <input id={id} name={k} type={type} value={values[k]} onChange={set(k)} placeholder={label} autoComplete={autoComplete} aria-invalid={!!err} aria-describedby={err ? `${id}-err` : undefined} required={required} className={`${base} ${tone}`} />
        )}
        <label
          htmlFor={id}
          className="pointer-events-none absolute left-0 top-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-mist transition-all peer-placeholder-shown:top-7 peer-placeholder-shown:text-base peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:top-1 peer-focus:text-[11px] peer-focus:uppercase peer-focus:tracking-[0.22em] peer-focus:text-gold-deep"
        >
          {label} {required ? <span aria-hidden className="text-gold-deep">*</span> : <span className="text-mist/70">(optional)</span>}
        </label>
        {err && (
          <p id={`${id}-err`} className="mt-2 text-sm text-red-800">
            {err}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="relative flex h-full flex-col rounded-3xl border border-gold/30 bg-white p-6 shadow-[0_50px_90px_-50px_rgba(48,35,59,0.55)] sm:p-10 lg:p-12">
      <span aria-hidden className="pointer-events-none absolute inset-x-10 top-0 h-[3px] rounded-b-full bg-gradient-to-r from-transparent via-gold to-transparent" />
      <AnimatePresence mode="wait" initial={false}>
        {status === "sent" ? (
          <motion.div key="sent" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative py-10 text-center" role="status">
            <CheckCircle2 size={44} className="mx-auto text-gold" strokeWidth={1.25} />
            <h2 className="mt-6 font-display text-4xl text-plum">Thank you, {values.name.split(" ")[0]}.</h2>
            <p className="mx-auto mt-4 max-w-md text-mist">
              Your enquiry has been received and our team will get back to you. If it&rsquo;s urgent, please call us directly.
            </p>
            <button
              type="button"
              onClick={() => {
                setValues({ ...EMPTY, subject: presetSubject ?? "" });
                setStatus("idle");
              }}
              className="mt-8 text-xs font-semibold uppercase tracking-[0.22em] text-gold-deep underline-offset-4 hover:underline"
            >
              Write another enquiry
            </button>
          </motion.div>
        ) : (
          <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={onSubmit} noValidate className="relative flex flex-1 flex-col">
            <h2 className="font-display text-4xl text-plum">Send an enquiry</h2>
            <p className="mt-3 flex items-start gap-2 text-sm text-mist">
              <Info size={16} className="mt-0.5 shrink-0 text-gold-deep" />
              We usually reply within a few working days. Fields marked * are required.
            </p>
            {errors.form && (
              <p role="alert" className="mt-5 border-l-2 border-red-700 bg-red-50 px-4 py-3 text-sm text-red-800">
                {errors.form}
              </p>
            )}
            <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <label htmlFor={`${uid}-website`}>Leave this field empty</label>
              <input id={`${uid}-website`} name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </div>
            <div className="mt-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-mist">What is it about?</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {TOPICS.map((t) => {
                  const on = values.subject === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      aria-pressed={on}
                      onClick={() => {
                        setValues((v) => ({ ...v, subject: t }));
                        if (errors.subject) setErrors((e) => ({ ...e, subject: undefined }));
                      }}
                      className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${on ? "border-plum bg-plum text-ivory" : "border-plum/15 bg-lavender/40 text-plum hover:border-gold hover:bg-lavender"}`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="mt-8 grid gap-7 sm:grid-cols-2">
              {field("name", "Your name", "text", "name")}
              {field("email", "Email address", "email", "email")}
            </div>
            <div className="mt-7 grid gap-7 sm:grid-cols-2">
              {field("phone", "Phone", "tel", "tel", false)}
              {field("subject", "Subject")}
            </div>
            <div className="mt-7 grid gap-7">
              {field("message", "Your message", "textarea")}
            </div>
            <button
              type="submit"
              disabled={status === "sending"}
              className="group mt-10 inline-flex w-full items-center justify-center gap-3 bg-plum px-8 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-ivory transition-colors hover:bg-gold hover:text-plum-deep disabled:opacity-70 sm:w-auto"
            >
              {status === "sending" ? (
                <>
                  Sending <Loader2 size={16} className="animate-spin" />
                </>
              ) : (
                <>
                  Send enquiry <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>

            {/* What happens next — fills the card and sets expectations */}
            <div className="mt-auto pt-10">
              <div className="rounded-2xl bg-[linear-gradient(135deg,#f3ecfb_0%,#e9ddf8_60%,#f6efe1_100%)] p-6 ring-1 ring-gold/20">
                <p className="eyebrow text-[10px] text-gold-deep">What happens next</p>
                <ol className="mt-4 grid gap-5 sm:grid-cols-3">
                  {NEXT_STEPS.map(({ icon: Icon, title, text }, i) => (
                    <li key={title} className="relative">
                      <span className="flex items-center gap-2">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-plum text-gold-soft shadow-[0_8px_18px_-8px_rgba(48,35,59,0.8)]">
                          <Icon size={16} />
                        </span>
                        <span className="font-display text-sm italic text-gold-deep">0{i + 1}</span>
                      </span>
                      <p className="mt-3 font-display text-lg leading-tight text-plum">{title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-plum/65">{text}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
