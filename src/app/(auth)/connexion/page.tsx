"use client";

import logoBlanc from "@/assets/logos/logo_blanc.png";
import Image from "next/image";
import Link from "next/link";
import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

const inputClass =
  "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3.5 text-sm text-white placeholder-white/30 outline-none transition focus:border-primary focus:bg-white/8";

function ConnexionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || null;

  const [form, setForm] = useState({ email: "", motdepasse: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (erreur) setErreur("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErreur("");

    const result = await signIn("credentials", {
      email: form.email,
      password: form.motdepasse,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setErreur("Email ou mot de passe incorrect.");
      return;
    }

    // Récupérer la session pour connaître le rôle
    const { getSession } = await import("next-auth/react");
    const session = await getSession();
    const role = (session?.user as any)?.role;

    const destination = role === "EVANGELISTE" ? "/evangeliste" : "/";
    // Forcer une navigation absolue pour éviter les problèmes de proxy Cloudflare
    window.location.href = destination;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8">
      <div className="mb-7 text-center">
        <h1 className="text-2xl font-extrabold text-white">Bon retour parmi nous</h1>
        <p className="mt-1.5 text-sm text-white/50">
          Connectez-vous à votre espace d&apos;évangélisation
        </p>
      </div>

      {erreur && (
        <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-red/30 bg-red/10 px-4 py-3">
          <svg width={15} height={15} viewBox="0 0 24 24" fill="none" className="shrink-0 text-red">
            <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
          </svg>
          <p className="text-sm font-medium text-red">{erreur}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50">
            Adresse email
          </label>
          <input
            type="email"
            name="email"
            required
            placeholder="vous@exemple.fr"
            value={form.email}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wide text-white/50">
              Mot de passe
            </label>
            <Link href="/mot-de-passe-oublie" className="text-xs font-medium text-primary hover:underline">
              Mot de passe oublié ?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              name="motdepasse"
              required
              placeholder="••••••••"
              value={form.motdepasse}
              onChange={handleChange}
              className={`${inputClass} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
            >
              {showPw
                ? <svg width={16} height={16} viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" stroke="currentColor" strokeWidth={2} strokeLinecap="round" /></svg>
                : <svg width={16} height={16} viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" /><circle cx={12} cy={12} r={3} stroke="currentColor" strokeWidth={2} /></svg>
              }
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded-xl bg-primary py-4 text-sm font-bold text-white shadow-lg transition hover:bg-primary/90 disabled:opacity-60"
        >
          {loading ? "Connexion…" : "Se connecter →"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs text-white/30">ou</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <Link
        href="/inscription"
        className="flex w-full items-center justify-center rounded-xl border border-white/15 bg-white/5 py-3.5 text-sm font-semibold text-white/70 transition hover:border-white/25 hover:bg-white/10 hover:text-white"
      >
        Créer un compte →
      </Link>
    </div>
  );
}

export default function ConnexionPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#020D1A]">

      {/* Header */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#020D1A]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/accueil">
            <Image src={logoBlanc} height={44} alt="Walking by faith & love" style={{ objectFit: "contain" }} priority />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/connexion" className="rounded-lg px-4 py-2 text-sm font-semibold text-white/70 transition hover:text-white">
              Se connecter
            </Link>
            <Link href="/inscription" className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-primary/90">
              Commencer
            </Link>
          </div>
        </div>
      </nav>

      {/* Formulaire centré */}
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <Suspense fallback={<div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center text-white/50">Chargement…</div>}>
            <ConnexionForm />
          </Suspense>

          <p className="mt-6 text-center text-sm text-white/40">
            Votre église n&apos;est pas encore inscrite ?{" "}
            <Link href="/inscription" className="font-semibold text-primary hover:underline">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>

    </div>
  );
}
