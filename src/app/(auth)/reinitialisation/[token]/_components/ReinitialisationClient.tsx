"use client";

import logoBlanc from "@/assets/logos/logo_blanc.png";
import { validerResetToken, reinitialiserMotDePasse } from "@/actions/reset-password.actions";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const inputClass =
  "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3.5 text-sm text-white placeholder-white/30 outline-none transition focus:border-primary focus:bg-white/8";

export default function ReinitialisationClient({ token }: { token: string }) {
  const router = useRouter();

  const [etat, setEtat] = useState<"chargement" | "valide" | "invalide" | "succes">("chargement");
  const [infos, setInfos] = useState<{ nom: string; email: string } | null>(null);
  const [erreurToken, setErreurToken] = useState("");

  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [erreur, setErreur] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!token) return;
    validerResetToken(token).then((res) => {
      if (res.valid && res.nom && res.email) {
        setInfos({ nom: res.nom, email: res.email });
        setEtat("valide");
      } else {
        setErreurToken(res.error ?? "Lien invalide.");
        setEtat("invalide");
      }
    });
  }, [token]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");

    if (motDePasse.length < 8) {
      setErreur("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (motDePasse !== confirmation) {
      setErreur("Les mots de passe ne correspondent pas.");
      return;
    }

    startTransition(async () => {
      const res = await reinitialiserMotDePasse(token, motDePasse);
      if (res.success) {
        setEtat("succes");
        setTimeout(() => router.push("/connexion"), 3000);
      } else {
        setErreur(res.error ?? "Erreur inconnue.");
      }
    });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#020D1A] px-4 py-16">
      <div className="relative w-full max-w-md">

        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Link href="/accueil">
            <Image src={logoBlanc} height={52} alt="FIJ Save Souls" style={{ objectFit: "contain" }} priority />
          </Link>
        </div>

        {/* ── CHARGEMENT ── */}
        {etat === "chargement" && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center">
            <div className="mx-auto mb-4 size-10 animate-spin rounded-full border-2 border-white/10 border-t-primary" />
            <p className="text-sm text-white/50">Vérification du lien…</p>
          </div>
        )}

        {/* ── LIEN INVALIDE / EXPIRÉ ── */}
        {etat === "invalide" && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center">
            <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full border border-red/20 bg-red/10">
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  stroke="#E10E0E" strokeWidth={2} strokeLinecap="round" />
              </svg>
            </div>
            <h2 className="mb-2 text-lg font-bold text-white">Lien invalide</h2>
            <p className="mb-6 text-sm text-white/50">{erreurToken}</p>
            <Link
              href="/mot-de-passe-oublie"
              className="block w-full rounded-xl bg-primary py-3.5 text-center text-sm font-bold text-white transition hover:bg-primary/90"
            >
              Faire une nouvelle demande →
            </Link>
          </div>
        )}

        {/* ── FORMULAIRE ── */}
        {etat === "valide" && infos && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8">
            <div className="mb-7 text-center">
              <h1 className="text-2xl font-extrabold text-white">
                Nouveau mot de passe
              </h1>
              <p className="mt-1.5 text-sm text-white/50">
                Choisissez un nouveau mot de passe pour votre compte
              </p>
            </div>

            {/* Email affiché en lecture seule */}
            <div className="mb-5 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-white/30">Compte</p>
              <p className="mt-0.5 text-sm text-white/70">{infos.email}</p>
            </div>

            {erreur && (
              <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-red/30 bg-red/10 px-4 py-3">
                <svg width={15} height={15} viewBox="0 0 24 24" fill="none" className="shrink-0 text-red">
                  <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
                </svg>
                <p className="text-sm font-medium text-red">{erreur}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    required
                    placeholder="8 caractères minimum"
                    value={motDePasse}
                    onChange={(e) => setMotDePasse(e.target.value)}
                    className={`${inputClass} pr-11`}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                    {showPw
                      ? <svg width={16} height={16} viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" stroke="currentColor" strokeWidth={2} strokeLinecap="round" /></svg>
                      : <svg width={16} height={16} viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" /><circle cx={12} cy={12} r={3} stroke="currentColor" strokeWidth={2} /></svg>
                    }
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50">
                  Confirmer le mot de passe
                </label>
                <input
                  type={showPw ? "text" : "password"}
                  required
                  placeholder="Répétez votre mot de passe"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* Indicateur de force */}
              {motDePasse.length > 0 && (
                <div className="flex items-center gap-2">
                  {[4, 8, 12].map((seuil, i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                      motDePasse.length >= seuil
                        ? i === 0 ? "bg-red" : i === 1 ? "bg-[#FF9C55]" : "bg-green"
                        : "bg-white/10"
                    }`} />
                  ))}
                  <span className="text-[11px] text-white/30">
                    {motDePasse.length < 4 ? "Trop court" : motDePasse.length < 8 ? "Faible" : motDePasse.length < 12 ? "Correct" : "Fort"}
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="mt-2 w-full rounded-xl bg-primary py-4 text-sm font-bold text-white shadow-lg transition hover:bg-primary/90 disabled:opacity-60"
              >
                {isPending ? "Enregistrement…" : "Réinitialiser mon mot de passe →"}
              </button>
            </form>
          </div>
        )}

        {/* ── SUCCÈS ── */}
        {etat === "succes" && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center">
            <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full border border-green/20 bg-green/10">
              <svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="#22AD5C" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="mb-2 text-xl font-bold text-white">Mot de passe réinitialisé !</h2>
            <p className="mb-6 text-sm text-white/50">
              Votre mot de passe a été mis à jour. Vous allez être redirigé vers la connexion…
            </p>
            <Link
              href="/connexion"
              className="block w-full rounded-xl bg-primary py-3.5 text-center text-sm font-bold text-white transition hover:bg-primary/90"
            >
              Se connecter maintenant →
            </Link>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-white/30">
          FIJ Save Souls — Plateforme d&apos;évangélisation
        </p>
      </div>
    </div>
  );
}
