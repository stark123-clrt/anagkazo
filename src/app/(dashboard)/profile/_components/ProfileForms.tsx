"use client";

import { updatePassword, updateProfileInfos } from "@/actions/profile.actions";
import { useState, useTransition } from "react";

const inputClass =
  "w-full rounded-lg border border-stroke bg-gray-1 px-4 py-3 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary";

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
      <circle cx={12} cy={12} r={3} stroke="currentColor" strokeWidth={2} />
    </svg>
  );
}

function Toast({ type, msg }: { type: "succes" | "erreur"; msg: string }) {
  return (
    <span className={`flex items-center gap-1.5 text-sm font-medium ${type === "succes" ? "text-green" : "text-red"}`}>
      {type === "succes" ? (
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
        </svg>
      )}
      {msg}
    </span>
  );
}

export function ProfileForms({ nom, email }: { nom: string; email: string }) {
  // ── Infos ──
  const [nomVal, setNomVal] = useState(nom);
  const [infoStatut, setInfoStatut] = useState<"idle" | "succes" | "erreur">("idle");
  const [infoMsg, setInfoMsg] = useState("");
  const [infoPending, startInfoTransition] = useTransition();

  function handleSaveInfos(e: React.FormEvent) {
    e.preventDefault();
    setInfoStatut("idle");
    startInfoTransition(async () => {
      const result = await updateProfileInfos({ nom: nomVal });
      if (result.success) {
        setInfoStatut("succes");
        setInfoMsg("Modifications enregistrées !");
      } else {
        setInfoStatut("erreur");
        setInfoMsg(result.error ?? "Erreur inconnue.");
      }
      setTimeout(() => setInfoStatut("idle"), 3500);
    });
  }

  // ── Mot de passe ──
  const [pw, setPw] = useState({ actuel: "", nouveau: "", confirm: "" });
  const [showPw, setShowPw] = useState({ actuel: false, nouveau: false, confirm: false });
  const [pwStatut, setPwStatut] = useState<"idle" | "succes" | "erreur">("idle");
  const [pwMsg, setPwMsg] = useState("");
  const [pwPending, startPwTransition] = useTransition();

  function handleChangePw(e: React.FormEvent) {
    e.preventDefault();
    if (pw.nouveau !== pw.confirm) return;
    setPwStatut("idle");
    startPwTransition(async () => {
      const result = await updatePassword({ actuel: pw.actuel, nouveau: pw.nouveau });
      if (result.success) {
        setPwStatut("succes");
        setPwMsg("Mot de passe mis à jour !");
        setPw({ actuel: "", nouveau: "", confirm: "" });
      } else {
        setPwStatut("erreur");
        setPwMsg(result.error ?? "Erreur inconnue.");
      }
      setTimeout(() => setPwStatut("idle"), 3500);
    });
  }

  const pwForce = pw.nouveau.length === 0 ? 0 :
    pw.nouveau.length < 6 ? 1 :
    pw.nouveau.length < 10 ? 2 :
    /[A-Z]/.test(pw.nouveau) && /[0-9]/.test(pw.nouveau) ? 4 : 3;

  return (
    <>
      {/* ── INFORMATIONS PERSONNELLES ── */}
      <form onSubmit={handleSaveInfos} className="mb-6 rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
        <div className="border-b border-stroke px-7 py-5 dark:border-dark-3">
          <h3 className="font-bold text-dark dark:text-white">Informations personnelles</h3>
          <p className="mt-0.5 text-sm text-dark-5 dark:text-dark-6">Mettez à jour votre nom d&apos;affichage</p>
        </div>

        <div className="space-y-5 px-7 py-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-dark dark:text-white">Nom complet</label>
              <input
                type="text"
                value={nomVal}
                onChange={(e) => setNomVal(e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-dark dark:text-white">Adresse email</label>
              <input
                type="email"
                value={email}
                readOnly
                className={`${inputClass} cursor-default opacity-60`}
              />
              <p className="mt-1 text-xs text-dark-5 dark:text-dark-6">L&apos;email ne peut pas être modifié.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={infoPending || !nomVal.trim()}
              className="rounded-lg bg-primary px-6 py-2.5 font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
            >
              {infoPending ? "Enregistrement…" : "Sauvegarder"}
            </button>
            {infoStatut !== "idle" && <Toast type={infoStatut} msg={infoMsg} />}
          </div>
        </div>
      </form>

      {/* ── SÉCURITÉ ── */}
      <form onSubmit={handleChangePw} className="rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
        <div className="border-b border-stroke px-7 py-5 dark:border-dark-3">
          <h3 className="font-bold text-dark dark:text-white">Sécurité</h3>
          <p className="mt-0.5 text-sm text-dark-5 dark:text-dark-6">Changez votre mot de passe</p>
        </div>

        <div className="space-y-5 px-7 py-6">
          {/* Mot de passe actuel */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-dark dark:text-white">Mot de passe actuel</label>
            <div className="relative">
              <input
                type={showPw.actuel ? "text" : "password"}
                value={pw.actuel}
                onChange={(e) => setPw({ ...pw, actuel: e.target.value })}
                placeholder="••••••••"
                className={`${inputClass} pr-11`}
              />
              <button type="button" onClick={() => setShowPw({ ...showPw, actuel: !showPw.actuel })}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark-5 hover:text-dark dark:hover:text-white">
                <EyeIcon open={showPw.actuel} />
              </button>
            </div>
          </div>

          {/* Nouveau + Confirmation */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-dark dark:text-white">Nouveau mot de passe</label>
              <div className="relative">
                <input
                  type={showPw.nouveau ? "text" : "password"}
                  value={pw.nouveau}
                  onChange={(e) => setPw({ ...pw, nouveau: e.target.value })}
                  placeholder="••••••••"
                  className={`${inputClass} pr-11`}
                />
                <button type="button" onClick={() => setShowPw({ ...showPw, nouveau: !showPw.nouveau })}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark-5 hover:text-dark dark:hover:text-white">
                  <EyeIcon open={showPw.nouveau} />
                </button>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-dark dark:text-white">Confirmer</label>
              <div className="relative">
                <input
                  type={showPw.confirm ? "text" : "password"}
                  value={pw.confirm}
                  onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
                  placeholder="••••••••"
                  className={`${inputClass} pr-11 ${pw.confirm && pw.nouveau !== pw.confirm ? "!border-red" : ""}`}
                />
                <button type="button" onClick={() => setShowPw({ ...showPw, confirm: !showPw.confirm })}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark-5 hover:text-dark dark:hover:text-white">
                  <EyeIcon open={showPw.confirm} />
                </button>
              </div>
              {pw.confirm && pw.nouveau !== pw.confirm && (
                <p className="mt-1 text-xs text-red">Les mots de passe ne correspondent pas</p>
              )}
            </div>
          </div>

          {/* Force */}
          {pw.nouveau && (
            <div>
              <p className="mb-1.5 text-xs font-semibold text-dark-5 dark:text-dark-6">Force du mot de passe</p>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${
                    pwForce >= i
                      ? i === 1 ? "bg-red" : i === 2 ? "bg-[#FF9C55]" : i === 3 ? "bg-primary" : "bg-green"
                      : "bg-stroke dark:bg-dark-3"
                  }`} />
                ))}
              </div>
              <p className="mt-1 text-xs text-dark-5 dark:text-dark-6">
                {["", "Trop court", "Faible", "Moyen", "Fort"][pwForce]}
              </p>
            </div>
          )}

          <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={pwPending || !pw.actuel || !pw.nouveau || pw.nouveau !== pw.confirm}
              className="rounded-lg bg-primary px-6 py-2.5 font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
            >
              {pwPending ? "Mise à jour…" : "Changer le mot de passe"}
            </button>
            {pwStatut !== "idle" && <Toast type={pwStatut} msg={pwMsg} />}
          </div>
        </div>
      </form>
    </>
  );
}
