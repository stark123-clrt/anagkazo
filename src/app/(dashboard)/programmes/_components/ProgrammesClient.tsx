"use client";

import { supprimerProgramme } from "@/actions/programme.actions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface GroupeDetail {
  groupe: number;
  membres: string[];   // IDs
  nomsM: string[];     // noms résolus
}

interface Programme {
  id: string;
  titre: string;
  lieu: string;
  date: string;
  statut: string;
  nbGroupes: number;
  nbEvangRepartis: number;
  nomsEvang: string[];
  nbRencontres: number;
  groupesDetail: GroupeDetail[];
}

interface Evangeliste {
  id: string;
  nom: string;
}

const STATUT_CONFIG: Record<string, { label: string; badge: string }> = {
  a_venir:  { label: "À venir",  badge: "bg-primary/15 text-primary"   },
  en_cours: { label: "En cours", badge: "bg-green/15 text-green"        },
  termine:  { label: "Terminé",  badge: "bg-gray-100 text-dark-5 dark:bg-dark-2 dark:text-dark-6" },
};

const ACCENT_COLORS = [
  { bg: "bg-primary",   border: "border-l-primary",   text: "text-primary",   header: "bg-primary"   },
  { bg: "bg-[#FF9C55]", border: "border-l-[#FF9C55]", text: "text-[#FF9C55]", header: "bg-[#FF9C55]" },
  { bg: "bg-green",     border: "border-l-green",     text: "text-green",     header: "bg-green"     },
  { bg: "bg-[#8155FF]", border: "border-l-[#8155FF]", text: "text-[#8155FF]", header: "bg-[#8155FF]" },
];

const MOIS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const JOURS_COURTS = ["L","M","M","J","V","S","D"];

function formatDateCourte(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function buildCalendrier(year: number, month: number, programmes: Programme[]) {
  const firstDay = new Date(year, month, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<{ day: number | null; programmes: Programme[] }> = [];
  for (let i = 0; i < offset; i++) cells.push({ day: null, programmes: [] });
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ day: d, programmes: programmes.filter((p) => p.date.startsWith(dateStr)) });
  }
  while (cells.length % 7 !== 0) cells.push({ day: null, programmes: [] });
  return cells;
}

// ─── Modale Supprimer ────────────────────────────────────────────────────────

function ModalSupprimer({
  programme,
  onClose,
  onDeleted,
}: {
  programme: Programme;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [erreur, setErreur] = useState("");

  function handleDelete() {
    startTransition(async () => {
      const res = await supprimerProgramme(programme.id);
      if (res.error) { setErreur(res.error); return; }
      onDeleted();
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 dark:bg-gray-dark">
        <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-red/10 mx-auto">
          <svg width={26} height={26} viewBox="0 0 24 24" fill="none">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="#E10E0E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 className="mb-1 text-center font-bold text-dark dark:text-white">Supprimer ce programme ?</h3>
        <p className="mb-1 text-center text-sm font-semibold text-dark dark:text-white">{programme.titre}</p>
        <p className="mb-5 text-center text-sm text-dark-5 dark:text-dark-6">
          Cette action est irréversible. Les rencontres liées ne seront pas supprimées.
        </p>
        {erreur && <p className="mb-3 text-center text-sm text-red">{erreur}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-stroke py-3 text-sm font-semibold dark:border-dark-3 dark:text-white">
            Annuler
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="flex-1 rounded-xl bg-red py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {isPending ? "Suppression…" : "Supprimer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Carte Programme ─────────────────────────────────────────────────────────

function ProgrammeCard({
  p,
  accent,
  isAdmin,
  onModifier,
  onSupprimer,
}: {
  p: Programme;
  accent: typeof ACCENT_COLORS[0];
  isAdmin: boolean;
  onModifier: () => void;
  onSupprimer: () => void;
}) {
  const cfg = STATUT_CONFIG[p.statut] ?? STATUT_CONFIG.a_venir;

  return (
    <div className={`overflow-hidden rounded-[10px] border-l-4 ${accent.border} bg-white shadow-1 dark:bg-gray-dark dark:shadow-card`}>
      {/* Header coloré */}
      <div className={`${accent.header} flex items-center justify-between px-4 py-2.5`}>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${cfg.badge}`}>
          {cfg.label}
        </span>
        <span className="text-xs font-semibold text-white/90">
          {new Date(p.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
        </span>
      </div>

      <div className="p-4">
        <div className="mb-1 flex items-start justify-between gap-2">
          <h3 className="text-[15px] font-bold text-dark dark:text-white">{p.titre}</h3>
          {isAdmin && (
            <div className="flex shrink-0 gap-1">
              <button
                onClick={onModifier}
                className="flex size-7 items-center justify-center rounded-lg border border-stroke text-dark-5 transition hover:border-primary hover:text-primary dark:border-dark-3 dark:text-dark-6"
                title="Modifier"
              >
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
                </svg>
              </button>
              <button
                onClick={onSupprimer}
                className="flex size-7 items-center justify-center rounded-lg border border-stroke text-dark-5 transition hover:border-red hover:text-red dark:border-dark-3 dark:text-dark-6"
                title="Supprimer"
              >
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          )}
        </div>

        <div className="mb-3 flex items-center gap-1.5 text-sm text-dark-5 dark:text-dark-6">
          <svg width={13} height={13} viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2.25C8.27 2.25 5.25 5.27 5.25 9c0 5.25 6.75 12.75 6.75 12.75S18.75 14.25 18.75 9c0-3.73-3.02-6.75-6.75-6.75zm0 9a2.25 2.25 0 110-4.5 2.25 2.25 0 010 4.5z" />
          </svg>
          <span className="truncate">{p.lieu}</span>
        </div>

        {/* Stats */}
        <div className="mb-3 grid grid-cols-3 divide-x divide-stroke rounded-lg border border-stroke dark:divide-dark-3 dark:border-dark-3">
          {[
            { val: p.nbGroupes, label: "Groupes" },
            { val: p.nbEvangRepartis, label: "Évangélistes" },
            { val: p.nbRencontres, label: "Âmes" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center py-2.5">
              <p className={`text-base font-bold ${accent.text}`}>{s.val}</p>
              <p className="text-[10px] text-dark-5 dark:text-dark-6">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Équipe */}
        {p.nomsEvang.length > 0 && (
          <div className="mb-3">
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-dark-5 dark:text-dark-6">Équipe</p>
            <div className="flex flex-wrap gap-1.5">
              {p.nomsEvang.map((nom) => (
                <span key={nom} className="rounded-full bg-gray-1 px-2.5 py-0.5 text-xs font-medium text-dark dark:bg-dark-2 dark:text-white">
                  {nom}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-stroke pt-3 dark:border-dark-3">
          <p className="text-xs capitalize text-dark-5 dark:text-dark-6">
            {new Date(p.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Composant principal ─────────────────────────────────────────────────────

export default function ProgrammesClient({
  programmes: initial,
  evangelistes,
  isAdmin,
}: {
  programmes: Programme[];
  evangelistes: Evangeliste[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [programmes] = useState(initial);
  const [onglet, setOnglet] = useState<"cartes" | "calendrier">("cartes");
  const [modalSuppr, setModalSuppr] = useState<Programme | null>(null);

  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());

  const aVenir = programmes.filter((p) => p.statut === "a_venir" || p.statut === "en_cours");
  const termines = programmes.filter((p) => p.statut === "termine");
  const enCours = programmes.filter((p) => p.statut === "en_cours");

  const grid = buildCalendrier(calYear, calMonth, programmes);
  const progsMois = programmes.filter((p) => {
    const d = new Date(p.date);
    return d.getFullYear() === calYear && d.getMonth() === calMonth;
  });

  function handleDeleted() {
    window.location.reload();
  }

  return (
    <>
      {/* ===== BANNIÈRE SORTIE EN COURS ===== */}
      {enCours.length > 0 && (
        <div className="mb-5 overflow-hidden rounded-[10px] border-l-4 border-l-green bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
          <div className="flex items-center gap-3 bg-green/10 px-4 py-3">
            <span className="flex size-2.5 shrink-0">
              <span className="absolute inline-flex size-2.5 animate-ping rounded-full bg-green opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-green" />
            </span>
            <p className="font-bold text-green">
              {enCours.length > 1 ? `${enCours.length} sorties en cours` : "Sortie en cours"}
            </p>
          </div>
          {enCours.map((prog) => (
            <div key={prog.id} className="border-t border-stroke/50 px-4 py-4 dark:border-dark-3">
              <div className="mb-1 flex items-center gap-2">
                <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor" className="shrink-0 text-green">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2.25C8.27 2.25 5.25 5.27 5.25 9c0 5.25 6.75 12.75 6.75 12.75S18.75 14.25 18.75 9c0-3.73-3.02-6.75-6.75-6.75zm0 9a2.25 2.25 0 110-4.5 2.25 2.25 0 010 4.5z" />
                </svg>
                <p className="font-semibold text-dark dark:text-white">{prog.titre} — {prog.lieu}</p>
              </div>

              {prog.groupesDetail.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {prog.groupesDetail.map((g) => (
                    <div key={g.groupe} className="rounded-lg bg-gray-1 px-3 py-2 dark:bg-dark-2">
                      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-dark-5 dark:text-dark-6">
                        Groupe {g.groupe}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {g.nomsM.length > 0 ? g.nomsM.map((nom) => (
                          <span key={nom} className="rounded-full bg-green/15 px-2.5 py-0.5 text-xs font-semibold text-green">
                            {nom}
                          </span>
                        )) : (
                          <span className="text-xs text-dark-5 dark:text-dark-6">Aucun membre assigné</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-dark-5 dark:text-dark-6">Aucun groupe défini pour cette sortie.</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* EN-TÊTE */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="text-sm text-dark-5 dark:text-dark-6">
          {programmes.length} sortie{programmes.length !== 1 ? "s" : ""} enregistrée{programmes.length !== 1 ? "s" : ""}
        </p>
        {isAdmin && (
          <Link
            href="/programmes/nouveau"
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-primary/90 active:scale-95"
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
            </svg>
            + Créer une sortie
          </Link>
        )}
      </div>

      {/* ONGLETS */}
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl border border-stroke bg-white p-1 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        {(["cartes", "calendrier"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setOnglet(tab)}
            className={`rounded-lg py-2.5 text-sm font-semibold transition ${
              onglet === tab ? "bg-primary text-white shadow-sm" : "text-dark-5 dark:text-dark-6"
            }`}
          >
            {tab === "cartes" ? "Toutes les sorties" : "Calendrier"}
          </button>
        ))}
      </div>

      {/* ===== VUE CARTES ===== */}
      {onglet === "cartes" && (
        <>
          {programmes.length === 0 ? (
            <div className="rounded-[10px] bg-white px-6 py-14 text-center shadow-1 dark:bg-gray-dark">
              <p className="text-sm text-dark-5 dark:text-dark-6">Aucun programme créé.</p>
              {isAdmin && (
                <Link href="/programmes/nouveau" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
                  Créer le premier programme →
                </Link>
              )}
            </div>
          ) : (
            <>
              {aVenir.length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-dark-5 dark:text-dark-6">
                    À venir · {aVenir.length}
                  </h3>
                  <div className="space-y-4 sm:grid sm:grid-cols-2 sm:gap-5 sm:space-y-0 xl:grid-cols-3">
                    {aVenir.map((p, i) => (
                      <ProgrammeCard
                        key={p.id}
                        p={p}
                        accent={ACCENT_COLORS[i % ACCENT_COLORS.length]}
                        isAdmin={isAdmin}
                        onModifier={() => router.push(`/programmes/${p.id}/modifier`)}
                        onSupprimer={() => setModalSuppr(p)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {termines.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-dark-5 dark:text-dark-6">
                    Terminés · {termines.length}
                  </h3>
                  <div className="space-y-4 sm:grid sm:grid-cols-2 sm:gap-5 sm:space-y-0 xl:grid-cols-3">
                    {termines.map((p, i) => (
                      <ProgrammeCard
                        key={p.id}
                        p={p}
                        accent={ACCENT_COLORS[i % ACCENT_COLORS.length]}
                        isAdmin={isAdmin}
                        onModifier={() => router.push(`/programmes/${p.id}/modifier`)}
                        onSupprimer={() => setModalSuppr(p)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ===== VUE CALENDRIER ===== */}
      {onglet === "calendrier" && (
        <div className="rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
          <div className="flex items-center justify-between border-b border-stroke px-4 py-3.5 dark:border-dark-3">
            <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }}
              className="rounded-lg p-2 transition hover:bg-gray-1 dark:hover:bg-dark-2 text-dark dark:text-white">
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <h3 className="text-base font-bold text-dark dark:text-white">{MOIS_FR[calMonth]} {calYear}</h3>
            <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }}
              className="rounded-lg p-2 transition hover:bg-gray-1 dark:hover:bg-dark-2 text-dark dark:text-white">
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 border-b border-stroke dark:border-dark-3">
            {JOURS_COURTS.map((j, i) => (
              <div key={i} className="py-2.5 text-center text-xs font-bold uppercase text-dark-5 dark:text-dark-6">{j}</div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {grid.map((cell, i) => {
              const isLastRow = i >= grid.length - 7;
              const isLastCol = i % 7 === 6;
              const hasEvent = cell.programmes.length > 0;
              return (
                <div key={i} className={`relative p-1 sm:p-2 ${!isLastRow ? "border-b border-stroke dark:border-dark-3" : ""} ${!isLastCol ? "border-r border-stroke dark:border-dark-3" : ""} ${!cell.day ? "bg-gray-1/40 dark:bg-dark-2/20" : ""}`}>
                  {cell.day && (
                    <>
                      <span className={`flex size-6 items-center justify-center rounded-full text-xs font-semibold sm:size-7 sm:text-sm ${hasEvent ? "bg-primary text-white" : "text-dark dark:text-white"}`}>
                        {cell.day}
                      </span>
                      {hasEvent && (
                        <>
                          <div className="mt-1 flex justify-center gap-0.5 sm:hidden">
                            {cell.programmes.map((p, pi) => (
                              <span key={p.id} className={`size-1.5 rounded-full ${ACCENT_COLORS[pi % ACCENT_COLORS.length].bg}`} />
                            ))}
                          </div>
                          <div className="mt-1 hidden space-y-0.5 sm:block">
                            {cell.programmes.map((p, pi) => (
                              <div key={p.id} className={`${ACCENT_COLORS[pi % ACCENT_COLORS.length].bg} truncate rounded px-1.5 py-0.5 text-[11px] font-semibold text-white`} title={p.lieu}>
                                {p.titre}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {progsMois.length > 0 ? (
            <div className="border-t border-stroke px-4 py-4 dark:border-dark-3">
              <p className="mb-2.5 text-xs font-bold uppercase text-dark-5 dark:text-dark-6">Sorties ce mois · {progsMois.length}</p>
              <div className="space-y-2">
                {progsMois.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className={`size-2.5 shrink-0 rounded-full ${ACCENT_COLORS[i % ACCENT_COLORS.length].bg}`} />
                    <span className="flex-1 text-sm text-dark dark:text-white">{p.titre}</span>
                    <span className="shrink-0 text-xs text-dark-5 dark:text-dark-6">{formatDateCourte(p.date)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-sm text-dark-5 dark:text-dark-6">Aucun programme ce mois.</div>
          )}
        </div>
      )}

      {/* ===== MODALE SUPPRESSION ===== */}
      {modalSuppr && (
        <ModalSupprimer
          programme={modalSuppr}
          onClose={() => setModalSuppr(null)}
          onDeleted={handleDeleted}
        />
      )}
    </>
  );
}
