"use client";

import { useState, useTransition } from "react";
import { genererCodeAdmin, supprimerCodeAdmin } from "@/actions/invitation-admin.actions";

type Invitation = {
  id: string;
  code: string;
  usedAt: Date | null;
  expiresAt: Date;
  createdAt: Date;
};

export function InvitationsClient({ invitations: initial }: { invitations: Invitation[] }) {
  const [invitations, setInvitations] = useState(initial);
  const [modale, setModale] = useState(false);
  const [newCode, setNewCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [aSupprimer, setASupprimer] = useState<Invitation | null>(null);

  function generer() {
    startTransition(async () => {
      const result = await genererCodeAdmin();
      if (result.success) {
        setNewCode(result.invitation.code);
        setInvitations((prev) => [result.invitation as Invitation, ...prev]);
        setModale(true);
      }
    });
  }

  function copier(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function confirmerSupprimer() {
    if (!aSupprimer) return;
    startTransition(async () => {
      await supprimerCodeAdmin(aSupprimer.id);
      setInvitations((prev) => prev.filter((inv) => inv.id !== aSupprimer.id));
      setASupprimer(null);
    });
  }

  function statutLabel(inv: Invitation) {
    if (inv.usedAt) return { label: "Utilisé", cls: "bg-green/10 text-green" };
    if (new Date(inv.expiresAt) < new Date()) return { label: "Expiré", cls: "bg-red/10 text-red" };
    return { label: "Actif", cls: "bg-primary/10 text-primary" };
  }

  const actifs = invitations.filter((inv) => !inv.usedAt && new Date(inv.expiresAt) >= new Date()).length;
  const utilises = invitations.filter((inv) => inv.usedAt).length;

  return (
    <>
      {/* KPI CARDS */}
      <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: "Total codes", value: invitations.length, color: "text-primary" },
          { label: "Actifs", value: actifs, color: "text-green" },
          { label: "Utilisés", value: utilises, color: "text-[#FF9C55]" },
          { label: "Expirés", value: invitations.length - actifs - utilises, color: "text-red" },
        ].map((s) => (
          <div key={s.label} className="rounded-[10px] bg-white p-4 shadow-1 dark:bg-gray-dark dark:shadow-card">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="mt-0.5 text-xs text-dark-5 dark:text-dark-6">{s.label}</p>
          </div>
        ))}
      </div>

      {/* EN-TÊTE */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-dark dark:text-white">Codes d&apos;invitation Admin</h3>
          <p className="text-xs text-dark-5 dark:text-dark-6">Chaque code permet à une église de créer son espace admin.</p>
        </div>
        <button
          onClick={generer}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-primary/90 active:scale-95 disabled:opacity-60"
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
          </svg>
          {isPending ? "Génération…" : "Générer un code"}
        </button>
      </div>

      {invitations.length === 0 ? (
        <div className="rounded-[10px] bg-white px-6 py-12 text-center shadow-1 dark:bg-gray-dark">
          <p className="text-sm text-dark-5 dark:text-dark-6">Aucun code généré pour l&apos;instant.</p>
          <button onClick={generer} className="mt-3 text-sm font-semibold text-primary hover:underline">
            Générer le premier code →
          </button>
        </div>
      ) : (
        <>
          {/* MOBILE : liste */}
          <div className="space-y-3 sm:hidden">
            {invitations.map((inv) => {
              const { label, cls } = statutLabel(inv);
              return (
                <div key={inv.id} className="rounded-[10px] bg-white p-4 shadow-1 dark:bg-gray-dark dark:shadow-card">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-mono text-lg font-bold text-dark dark:text-white">{inv.code}</p>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${cls}`}>{label}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-dark-5 dark:text-dark-6">
                    <p>Créé le : <span className="font-medium text-dark dark:text-white">{new Date(inv.createdAt).toLocaleDateString("fr-FR")}</span></p>
                    <p>Expire le : <span className="font-medium text-dark dark:text-white">{new Date(inv.expiresAt).toLocaleDateString("fr-FR")}</span></p>
                  </div>
                  <div className="mt-3 flex gap-2 border-t border-stroke pt-3 dark:border-dark-3">
                    {!inv.usedAt && new Date(inv.expiresAt) >= new Date() && (
                      <button
                        onClick={() => copier(inv.code)}
                        className="flex-1 rounded-lg border border-stroke py-2 text-xs font-semibold text-dark transition hover:bg-gray-1 dark:border-dark-3 dark:text-white dark:hover:bg-white/5"
                      >
                        Copier
                      </button>
                    )}
                    <button
                      onClick={() => setASupprimer(inv)}
                      className="rounded-lg border border-stroke px-3 py-2 text-xs font-semibold text-red transition hover:bg-red/10 dark:border-dark-3"
                    >
                      <svg width={13} height={13} viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP : tableau */}
          <div className="hidden overflow-hidden rounded-[10px] bg-white shadow-1 dark:bg-gray-dark sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stroke text-left dark:border-dark-3">
                  <th className="px-5 py-4 font-semibold text-dark-4 dark:text-dark-6">Code</th>
                  <th className="px-5 py-4 font-semibold text-dark-4 dark:text-dark-6">Statut</th>
                  <th className="px-5 py-4 font-semibold text-dark-4 dark:text-dark-6">Expire le</th>
                  <th className="px-5 py-4 font-semibold text-dark-4 dark:text-dark-6">Créé le</th>
                  <th className="px-5 py-4 font-semibold text-dark-4 dark:text-dark-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((inv) => {
                  const { label, cls } = statutLabel(inv);
                  return (
                    <tr key={inv.id} className="border-b border-stroke last:border-0 dark:border-dark-3">
                      <td className="px-5 py-4 font-mono font-bold text-dark dark:text-white">{inv.code}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>{label}</span>
                      </td>
                      <td className="px-5 py-4 text-dark-4 dark:text-dark-6">{new Date(inv.expiresAt).toLocaleDateString("fr-FR")}</td>
                      <td className="px-5 py-4 text-dark-4 dark:text-dark-6">{new Date(inv.createdAt).toLocaleDateString("fr-FR")}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {!inv.usedAt && new Date(inv.expiresAt) >= new Date() && (
                            <button
                              onClick={() => copier(inv.code)}
                              className="rounded-lg border border-stroke px-3 py-1.5 text-xs font-semibold text-dark transition hover:bg-gray-1 dark:border-dark-3 dark:text-white dark:hover:bg-white/5"
                            >
                              Copier
                            </button>
                          )}
                          <button
                            onClick={() => setASupprimer(inv)}
                            title="Supprimer"
                            className="rounded-lg border border-stroke px-3 py-1.5 text-red transition hover:bg-red/10 dark:border-dark-3"
                          >
                            <svg width={14} height={14} viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* MODALE confirmation suppression */}
      {aSupprimer && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setASupprimer(null)} />
          <div className="relative z-10 w-full rounded-t-2xl bg-white dark:bg-gray-dark sm:max-w-sm sm:rounded-2xl">
            <div className="flex justify-center pt-3 sm:hidden">
              <div className="h-1 w-10 rounded-full bg-stroke dark:bg-dark-3" />
            </div>
            <div className="p-5">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-red/10">
                <svg width={22} height={22} viewBox="0 0 24 24" fill="none" className="text-red"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <h3 className="mb-1 text-center font-bold text-dark dark:text-white">Supprimer ce code ?</h3>
              <p className="mb-1 text-center font-mono text-lg font-bold text-primary">{aSupprimer.code}</p>
              <p className="mb-4 text-center text-xs text-dark-5 dark:text-dark-6">Cette action est irréversible.</p>
              <div className="flex gap-3">
                <button onClick={() => setASupprimer(null)} className="flex-1 rounded-xl border border-stroke py-3 text-sm font-semibold text-dark dark:border-dark-3 dark:text-white">
                  Annuler
                </button>
                <button onClick={confirmerSupprimer} disabled={isPending} className="flex-1 rounded-xl bg-red py-3 text-sm font-bold text-white transition hover:bg-red/90 disabled:opacity-50">
                  {isPending ? "Suppression…" : "Supprimer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALE nouveau code */}
      {modale && newCode && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModale(false)} />
          <div className="relative z-10 w-full rounded-t-2xl bg-white dark:bg-gray-dark sm:max-w-sm sm:rounded-2xl">
            <div className="flex justify-center pt-3 sm:hidden">
              <div className="h-1 w-10 rounded-full bg-stroke dark:bg-dark-3" />
            </div>
            <div className="p-5">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-green/10">
                <svg width={22} height={22} viewBox="0 0 24 24" fill="none" className="text-green"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" /></svg>
              </div>
              <h3 className="mb-1 text-center font-bold text-dark dark:text-white">Code généré !</h3>
              <p className="mb-4 text-center text-sm text-dark-5 dark:text-dark-6">Partagez ce code avec le responsable de l&apos;église.</p>
              <div className="mb-2 flex items-center gap-3 rounded-xl border border-stroke bg-gray-1 px-4 py-3 dark:border-dark-3 dark:bg-dark-2">
                <span className="flex-1 font-mono text-2xl font-bold tracking-widest text-dark dark:text-white">{newCode}</span>
                <button
                  onClick={() => copier(newCode)}
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white transition hover:bg-primary/90"
                >
                  {copied ? "Copié !" : "Copier"}
                </button>
              </div>
              <p className="mb-4 text-center text-xs text-dark-5 dark:text-dark-6">Valable 7 jours · Usage unique</p>
              <button onClick={() => setModale(false)} className="w-full rounded-xl border border-stroke py-3 text-sm font-semibold text-dark dark:border-dark-3 dark:text-white">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
