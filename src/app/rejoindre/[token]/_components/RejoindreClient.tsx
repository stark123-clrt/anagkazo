"use client";

import { inscrireViaQR } from "@/actions/qr-invite.actions";
import { useState, useTransition } from "react";

export default function RejoindreClient({ token, orgNom }: { token: string; orgNom: string }) {
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [statut, setStatut] = useState<"idle" | "succes" | "erreur">("idle");
  const [erreur, setErreur] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    startTransition(async () => {
      const res = await inscrireViaQR(token, nom, email);
      if (res.success) {
        setStatut("succes");
      } else {
        setStatut("erreur");
        setErreur(res.error ?? "Une erreur est survenue.");
      }
    });
  }

  if (statut === "succes") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-1 px-4 dark:bg-dark">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-lg dark:bg-gray-dark">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-green/10">
            <svg width={26} height={26} viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="#22c55e" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="mb-2 text-lg font-bold text-dark dark:text-white">Inscription réussie !</h2>
          <p className="mb-1 text-sm text-dark-5 dark:text-dark-6">
            Un email a été envoyé à <strong className="text-dark dark:text-white">{email}</strong>.
          </p>
          <p className="text-sm text-dark-5 dark:text-dark-6">
            Cliquez sur le lien dans l'email pour créer votre mot de passe et accéder à l'application.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-1 px-4 dark:bg-dark">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-lg dark:bg-gray-dark">

        {/* Header */}
        <div className="rounded-t-2xl bg-[#020D1A] px-8 py-7 text-center">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[2px] text-primary">Anagkazo</p>
          <h1 className="text-xl font-bold text-white">Rejoindre l'équipe</h1>
          <p className="mt-1 text-sm text-white/60">{orgNom}</p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="px-8 py-7 space-y-4">
          <p className="text-sm text-dark-5 dark:text-dark-6 text-center">
            Renseignez vos informations pour rejoindre l'équipe.
          </p>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-dark dark:text-white">
              Nom complet <span className="text-red">*</span>
            </label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Prénom Nom"
              required
              className="w-full rounded-xl border border-stroke bg-gray-1 px-4 py-3 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-dark dark:text-white">
              Email <span className="text-red">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
              className="w-full rounded-xl border border-stroke bg-gray-1 px-4 py-3 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
          </div>

          {statut === "erreur" && (
            <p className="rounded-lg bg-red/10 px-3 py-2 text-center text-sm font-semibold text-red">
              {erreur}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending || !nom.trim() || !email.trim()}
            className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-white transition hover:bg-primary/90 disabled:opacity-50"
          >
            {isPending ? "Envoi en cours…" : "Rejoindre l'équipe"}
          </button>
        </form>
      </div>
    </div>
  );
}
