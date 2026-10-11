"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Lock, Mail } from "lucide-react";
import { ApiError } from "@/lib/admin-api";
import { API_CONFIGURED } from "@/lib/api-config";
import { useAuth } from "@/components/admin/AuthProvider";
import { Button } from "@/components/admin/ui";

export default function AdminLoginPage() {
  const { login, status } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status === "authenticated") router.replace("/admin");
  }, [status, router]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setBusy(true);
    try {
      await login(email.trim(), password, remember);
      router.replace("/admin");
    } catch (err) {
      setError(err instanceof ApiError ? (err.field("email") ?? err.message) : "Sign-in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-plum-deep lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,#4a3858_0%,#30233b_45%,#1f1627_85%)]" />
        <div className="absolute left-1/2 top-1/2 h-[70vh] w-[70vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(233,221,248,0.35),transparent_65%)]" />
        <Image src="/images/cutouts/kanyaka-parameshwari-stone.webp" alt="" fill sizes="50vw" className="object-contain object-bottom px-[18%] pt-[14%] drop-shadow-[0_30px_30px_rgba(0,0,0,0.5)]" priority />
        <p className="absolute bottom-8 left-10 font-display text-3xl text-ivory">
          Devalok <em className="text-gold-sheen">CMS</em>
        </p>
      </div>
      <div className="flex items-center justify-center bg-ivory px-6 py-12">
        <form onSubmit={submit} noValidate className="w-full max-w-sm">
          <Image src="/images/brand/logo.png" alt="Devalok Sculptures" width={96} height={113} className="h-24 w-auto" priority />
          <h1 className="mt-8 font-display text-4xl font-semibold text-plum">Sign in</h1>
          <p className="mt-2 text-sm text-mist">Content management for Devalok Sculptures. Authorised staff only.</p>

          {!API_CONFIGURED && (
            <p role="status" className="mt-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              This is a website preview. The admin panel needs the Devalok backend, which isn&rsquo;t connected to this deployment.
            </p>
          )}
          {error && (
            <p role="alert" className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </p>
          )}

          <label className="mt-8 block text-sm font-semibold text-plum" htmlFor="email">
            Email
          </label>
          <div className="relative mt-1.5">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-mist" />
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-plum/20 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/25"
              required
            />
          </div>
          <label className="mt-5 block text-sm font-semibold text-plum" htmlFor="password">
            Password
          </label>
          <div className="relative mt-1.5">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-mist" />
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-plum/20 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/25"
              required
            />
          </div>
          <label className="mt-5 flex items-center gap-2 text-sm text-plum/80">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 accent-plum" />
            Keep me signed in on this device
          </label>
          <Button type="submit" loading={busy} className="mt-8 w-full py-3">
            Sign in
          </Button>
          <p className="mt-6 text-xs text-mist">Accounts are created by an administrator. There is no public sign-up.</p>
        </form>
      </div>
    </main>
  );
}
