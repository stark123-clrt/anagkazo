"use client";

import logoBlanc from "@/assets/logos/logo_blanc.png";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { verifierEmail } from "@/actions/auth.actions";

export default function VerifierEmailPage({ params }: { params: Promise<{ token: string }> }) {
  const [etat, setEtat] = useState<"chargement" | "succes" | "erreur">("chargement");
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    params.then(({ token }) => {
      verifierEmail(token).then((res) => {
        if (res.success) {
          setEtat("succes");
        } else {
          setErreur(res.error ?? "Lien invalide.");
          setEtat("erreur");
        }
      });
    });
  }, [params]);

  return (
    <div className="flex min-h-screen flex-col bg-[#020D1A]">
      {/* Header */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#020D1A]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/accueil">
            <Image src={logoBlanc} height={44} alt="Anagkazo" style={{ objectFit: "contain" }} priority />
          </Link>
        </div>
      </nav>

      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md text-center">

          {/* Chargement */}
          {etat === "chargement" && (
            <>
              <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full border border-white/10 bg-white/5">
                <svg className="animate-spin text-primary" width={32} height={32} viewBox="0 0 24 24" fill="none">
                  <circle cx={12} cy={12} r={10} stroke="currentColor" strokeWidth={2} strokeOpacity={0.2} />
                  <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-sm text-white/40">Vérification en cours…</p>
            </>
          )}

          {/* Succès */}
          {etat === "succes" && (
            <>
              <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
                <svg width={36} height={36} viewBox="0 0 24 24" fill="none">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#5750F1" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 className="mb-2 text-2xl font-extrabold text-white">Email confirmé !</h2>
              <p className="mb-8 text-sm text-white/40 leading-relaxed">
                Votre adresse email a été vérifiée. Votre compte est maintenant actif.
              </p>
              <Link
                href="/connexion"
                className="inline-block rounded-xl bg-primary px-8 py-3 text-sm font-bold text-white transition hover:bg-primary/90"
              >
                Se connecter
              </Link>
            </>
          )}

          {/* Erreur */}
          {etat === "erreur" && (
            <>
              <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full border border-red/30 bg-red/10">
                <svg width={36} height={36} viewBox="0 0 24 24" fill="none">
                  <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#F23030" strokeWidth={2} strokeLinecap="round" />
                </svg>
              </div>
              <h2 className="mb-2 text-2xl font-extrabold text-white">Lien invalide</h2>
              <p className="mb-8 text-sm text-white/40 leading-relaxed">{erreur}</p>
              <Link
                href="/connexion"
                className="inline-block rounded-xl border border-white/15 px-8 py-3 text-sm font-semibold text-white/60 transition hover:border-white/30 hover:text-white"
              >
                Retour à la connexion
              </Link>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
