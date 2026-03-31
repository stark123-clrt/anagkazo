"use client";

import { suspendreAdminGlobal, reactiverAdminGlobal, supprimerAdminGlobal } from "@/actions/super-admin.actions";
import { useState, useTransition } from "react";

interface OrgAdmin {
  id: string;
  nom: string;
  email: string;
  actif: boolean;
}

interface Organisation {
  id: string;
  nom: string;
  ville: string;
  admins: OrgAdmin[];
}

export function CelluleClient({ organisations }: { organisations: Organisation[] }) {
  const [orgSearch, setOrgSearch] = useState("");
  const [orgSelectId, setOrgSelectId] = useState<string | null>(null);
  const [actionAdmin, setActionAdmin] = useState<{ type: "suspendre" | "reactiver" | "supprimer"; admin: OrgAdmin } | null>(null);
  const [actionAdminErreur, setActionAdminErreur] = useState("");
  const [actionAdminPending, startActionAdminTransition] = useTransition();
  const [orgsState, setOrgsState] = useState<Organisation[]>(organisations);

  const orgsFiltrees = orgsState.filter((o) =>
    o.nom.toLowerCase().includes(orgSearch.toLowerCase()) ||
    o.ville.toLowerCase().includes(orgSearch.toLowerCase())
  );
  const orgSelectionnee = orgsState.find((o) => o.id === orgSelectId) ?? null;

  function confirmerActionAdmin() {
    if (!actionAdmin) return;
    setActionAdminErreur("");
    startActionAdminTransition(async () => {
      let result;
      if (actionAdmin.type === "suspendre") result = await suspendreAdminGlobal(actionAdmin.admin.id);
      else if (actionAdmin.type === "reactiver") result = await reactiverAdminGlobal(actionAdmin.admin.id);
      else result = await supprimerAdminGlobal(actionAdmin.admin.id);

      if (result.success) {
        setOrgsState((prev) => prev.map((o) => {
          if (o.id !== orgSelectId) return o;
          if (actionAdmin.type === "supprimer") {
            return { ...o, admins: o.admins.filter((a) => a.id !== actionAdmin.admin.id) };
          }
          return {
            ...o,
            admins: o.admins.map((a) =>
              a.id === actionAdmin.admin.id
                ? { ...a, actif: actionAdmin.type === "reactiver" }
                : a
            ),
          };
        }));
        setActionAdmin(null);
      } else {
        setActionAdminErreur(result.error ?? "Erreur.");
      }
    });
  }

  return (
    <>
      {/* Barre de recherche */}
      <div className="relative mb-4">
        <svg className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-5 dark:text-dark-6" width={15} height={15} viewBox="0 0 24 24" fill="none">
          <circle cx={11} cy={11} r={8} stroke="currentColor" strokeWidth={2}/>
          <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth={2} strokeLinecap="round"/>
        </svg>
        <input
          type="text"
          value={orgSearch}
          onChange={(e) => { setOrgSearch(e.target.value); setOrgSelectId(null); }}
          placeholder="Rechercher une organisation ou une ville..."
          className="w-full rounded-xl border border-stroke bg-white py-3 pl-10 pr-4 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-gray-dark dark:text-white"
        />
      </div>

      {/* Liste des orgs filtrées */}
      {orgSearch.length > 0 && !orgSelectionnee && (
        <div className="mb-4 overflow-hidden rounded-xl border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark">
          {orgsFiltrees.length === 0 ? (
            <p className="px-4 py-3 text-sm text-dark-5 dark:text-dark-6">Aucune organisation trouvée.</p>
          ) : (
            orgsFiltrees.map((o) => (
              <button
                key={o.id}
                onClick={() => setOrgSelectId(o.id)}
                className="flex w-full items-center justify-between border-b border-stroke px-4 py-3 text-left text-sm transition last:border-0 hover:bg-gray-1 dark:border-dark-3 dark:hover:bg-dark-2"
              >
                <div>
                  <p className="font-semibold text-dark dark:text-white">{o.nom}</p>
                  <p className="text-xs text-dark-5 dark:text-dark-6">{o.ville} · {o.admins.length} admin{o.admins.length !== 1 ? "s" : ""}</p>
                </div>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" className="shrink-0 text-dark-5"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            ))
          )}
        </div>
      )}

      {/* Organisation sélectionnée — admins */}
      {orgSelectionnee && (
        <div className="rounded-xl border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark">
          {/* En-tête org */}
          <div className="flex items-center justify-between border-b border-stroke px-4 py-3 dark:border-dark-3">
            <div>
              <p className="font-bold text-dark dark:text-white">{orgSelectionnee.nom}</p>
              <p className="text-xs text-dark-5 dark:text-dark-6">{orgSelectionnee.ville} · {orgSelectionnee.admins.length} admin{orgSelectionnee.admins.length !== 1 ? "s" : ""}</p>
            </div>
            <button
              onClick={() => { setOrgSelectId(null); setOrgSearch(""); }}
              className="flex size-7 items-center justify-center rounded-full transition hover:bg-gray-1 dark:hover:bg-dark-2"
            >
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth={2} strokeLinecap="round"/></svg>
            </button>
          </div>

          {orgSelectionnee.admins.length === 0 ? (
            <p className="px-4 py-4 text-sm text-dark-5 dark:text-dark-6">Aucun admin pour cette organisation.</p>
          ) : (
            <>
              {/* Mobile */}
              <div className="space-y-3 p-4 sm:hidden">
                {orgSelectionnee.admins.map((a) => (
                  <div key={a.id} className="rounded-[10px] bg-gray-1 p-4 dark:bg-dark-2/40">
                    <div className="flex items-center gap-3">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                        {a.nom.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-bold text-dark dark:text-white">{a.nom}</p>
                          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">Admin</span>
                          {!a.actif && <span className="rounded-full bg-red/10 px-2 py-0.5 text-[10px] font-bold text-red">Suspendu</span>}
                        </div>
                        <p className="truncate text-xs text-dark-5 dark:text-dark-6">{a.email}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2 border-t border-stroke pt-3 dark:border-dark-3">
                      {a.actif ? (
                        <button onClick={() => setActionAdmin({ type: "suspendre", admin: a })}
                          className="flex-1 rounded-lg border border-stroke py-2 text-xs font-semibold text-dark-5 transition hover:border-[#FF9C55]/50 hover:text-[#FF9C55] dark:border-dark-3 dark:text-dark-6">
                          Suspendre
                        </button>
                      ) : (
                        <button onClick={() => setActionAdmin({ type: "reactiver", admin: a })}
                          className="flex-1 rounded-lg border border-green/40 py-2 text-xs font-semibold text-green transition hover:bg-green/10">
                          Réactiver
                        </button>
                      )}
                      <button onClick={() => setActionAdmin({ type: "supprimer", admin: a })}
                        className="rounded-lg border border-stroke px-3 py-2 text-xs font-semibold text-red transition hover:bg-red/10 dark:border-dark-3">
                        <svg width={13} height={13} viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop */}
              <div className="hidden gap-5 p-4 sm:grid sm:grid-cols-2 xl:grid-cols-3">
                {orgSelectionnee.admins.map((a) => (
                  <div key={a.id} className="flex flex-col rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
                    <div className="relative flex flex-col items-center px-5 pb-4 pt-7 text-center">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">Admin</span>
                        {!a.actif && <span className="rounded-full bg-red/10 px-2 py-0.5 text-[10px] font-bold text-red">Suspendu</span>}
                      </div>
                      <div className="mt-3 mb-3 flex size-12 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                        {a.nom.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <p className="font-bold text-dark dark:text-white">{a.nom}</p>
                      <p className="mt-0.5 text-xs text-dark-5 dark:text-dark-6">{a.email}</p>
                    </div>
                    <div className="flex gap-2 border-t border-stroke px-4 pb-4 pt-3 dark:border-dark-3">
                      {a.actif ? (
                        <button onClick={() => setActionAdmin({ type: "suspendre", admin: a })}
                          className="flex-1 rounded-lg border border-stroke py-2 text-xs font-semibold text-dark-5 transition hover:border-[#FF9C55]/50 hover:text-[#FF9C55] dark:border-dark-3 dark:text-dark-6">
                          Suspendre l&apos;accès
                        </button>
                      ) : (
                        <button onClick={() => setActionAdmin({ type: "reactiver", admin: a })}
                          className="flex-1 rounded-lg border border-green/40 py-2 text-xs font-semibold text-green transition hover:bg-green/10">
                          Réouvrir l&apos;accès
                        </button>
                      )}
                      <button onClick={() => setActionAdmin({ type: "supprimer", admin: a })}
                        title="Supprimer"
                        className="rounded-lg border border-stroke px-3 py-2 text-red transition hover:bg-red/10 dark:border-dark-3">
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Modale confirmation action admin */}
      {actionAdmin && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActionAdmin(null)} />
          <div className="relative z-10 w-full rounded-t-2xl bg-white dark:bg-gray-dark sm:max-w-sm sm:rounded-2xl">
            <div className="flex justify-center pt-3 sm:hidden">
              <div className="h-1 w-10 rounded-full bg-stroke dark:bg-dark-3" />
            </div>
            <div className="p-5">
              <div className={`mx-auto mb-4 flex size-14 items-center justify-center rounded-full ${
                actionAdmin.type === "supprimer" ? "bg-red/10" :
                actionAdmin.type === "suspendre" ? "bg-[#FF9C55]/10" : "bg-green/10"
              }`}>
                {actionAdmin.type === "supprimer" && <svg width={22} height={22} viewBox="0 0 24 24" fill="none" className="text-red"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>}
                {actionAdmin.type === "suspendre" && <svg width={22} height={22} viewBox="0 0 24 24" fill="none" className="text-[#FF9C55]"><path d="M10 9v6m4-6v6M12 22a10 10 0 100-20 10 10 0 000 20z" stroke="currentColor" strokeWidth={2} strokeLinecap="round"/></svg>}
                {actionAdmin.type === "reactiver" && <svg width={22} height={22} viewBox="0 0 24 24" fill="none" className="text-green"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth={2} strokeLinecap="round"/></svg>}
              </div>
              <h3 className="mb-1 text-center font-bold text-dark dark:text-white">
                {actionAdmin.type === "supprimer" && "Supprimer cet admin ?"}
                {actionAdmin.type === "suspendre" && "Suspendre l'accès ?"}
                {actionAdmin.type === "reactiver" && "Réouvrir l'accès ?"}
              </h3>
              <p className="mb-1 text-center text-sm font-semibold text-dark dark:text-white">{actionAdmin.admin.nom}</p>
              <p className="mb-4 text-center text-xs text-dark-5 dark:text-dark-6">
                {actionAdmin.type === "supprimer" && "Cette action est irréversible."}
                {actionAdmin.type === "suspendre" && "Il ne pourra plus se connecter jusqu'à réactivation."}
                {actionAdmin.type === "reactiver" && "Il pourra à nouveau se connecter."}
              </p>
              {actionAdminErreur && (
                <p className="mb-3 rounded-lg bg-red/10 px-3 py-2 text-center text-xs font-semibold text-red">{actionAdminErreur}</p>
              )}
              <div className="flex gap-3">
                <button onClick={() => { setActionAdmin(null); setActionAdminErreur(""); }}
                  className="flex-1 rounded-xl border border-stroke py-3 text-sm font-semibold text-dark dark:border-dark-3 dark:text-white">
                  Annuler
                </button>
                <button onClick={confirmerActionAdmin} disabled={actionAdminPending}
                  className={`flex-1 rounded-xl py-3 text-sm font-bold text-white transition disabled:opacity-50 ${
                    actionAdmin.type === "supprimer" ? "bg-red hover:bg-red/90" :
                    actionAdmin.type === "suspendre" ? "bg-[#FF9C55] hover:bg-[#FF9C55]/90" : "bg-green hover:bg-green/90"
                  }`}>
                  {actionAdminPending ? "En cours…" :
                    actionAdmin.type === "supprimer" ? "Supprimer" :
                    actionAdmin.type === "suspendre" ? "Suspendre" : "Réactiver"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
