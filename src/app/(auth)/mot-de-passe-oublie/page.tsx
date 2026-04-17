"use client";

import logoBlanc from "@/assets/logos/logo_blanc.png";
import { demanderResetPassword } from "@/actions/reset-password.actions";
import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";

const inputClass =
  "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3.5 text-sm text-white placeholder-white/30 outline-none transition focus:border-primary focus:bg-white/8";

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState("");
  const [envoye, setEnvoye] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await demanderResetPassword(email.trim().toLowerCase());
      setEnvoye(true);
    });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#020D1A] px-4 py-16">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Link href="/accueil">
            <Image src={logoBlanc} height={52} alt="Walking by faith & love" style={{ objectFit: "contain" }} priority />
          </Link>
        </div>

        {!envoye ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8">
            <div className="mb-7 text-center">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
                <svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                  <path d="M15 7a4 4 0 11-8 0 4 4 0 018 0zM3 20a9 9 0 0118 0" stroke="#5750F1" strokeWidth={2} strokeLinecap="round" />
                </svg>
              </div>
              <h1 className="text-2xl font-extrabold text-white">Mot de passe oublié ?</h1>
              <p className="mt-1.5 text-sm text-white/50">
                Saisissez votre email, nous vous enverrons un lien pour réinitialiser votre mot de passe.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50">
                  Adresse email
                </label>
                <input
                  type="email"
                  required
                  placeholder="vous@exemple.fr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </div>

              <button
                type="submit"
                disabled={isPending || !email.trim()}
                className="mt-2 w-full rounded-xl bg-primary py-4 text-sm font-bold text-white shadow-lg transition hover:bg-primary/90 disabled:opacity-60"
              >
                {isPending ? "Envoi en cours…" : "Envoyer le lien →"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/connexion" className="text-sm font-medium text-white/40 hover:text-white transition">
                ← Retour à la connexion
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center">
            <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full border border-green/20 bg-green/10">
              <svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  stroke="#22AD5C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="mb-2 text-xl font-bold text-white">Email envoyé !</h2>
            <p className="mb-6 text-sm text-white/50">
              Si cette adresse email est associée à un compte, vous recevrez un lien de réinitialisation dans quelques minutes. Vérifiez aussi vos spams.
            </p>
            <Link
              href="/connexion"
              className="block w-full rounded-xl bg-primary py-3.5 text-center text-sm font-bold text-white transition hover:bg-primary/90"
            >
              Retour à la connexion →
            </Link>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-white/30">
          Walking by faith & love — Plateforme d&apos;évangélisation
        </p>
      </div>
    </div>
  );
}
