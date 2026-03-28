"use client";

import { useState } from "react";

interface Sortie {
  id: string;
  titre: string;
  lieu: string;
  date: string; // "YYYY-MM-DD"
  heure: string;
  statut: string;
  evangelistes: string[];
  monGroupeNumero: number | null;
  monGroupeMembres: string[];
}

const COULEURS = [
  { bordure: "border-l-primary",    couleur: "bg-primary",    accentText: "text-primary",    accentBg: "bg-primary/10"    },
  { bordure: "border-l-[#FF9C55]",  couleur: "bg-[#FF9C55]",  accentText: "text-[#FF9C55]",  accentBg: "bg-[#FF9C55]/10"  },
  { bordure: "border-l-green",      couleur: "bg-green",      accentText: "text-green",      accentBg: "bg-green/10"      },
  { bordure: "border-l-[#8155FF]",  couleur: "bg-[#8155FF]",  accentText: "text-[#8155FF]",  accentBg: "bg-[#8155FF]/10"  },
];

const JOURS = ["L", "M", "M", "J", "V", "S", "D"];
const JOURS_FULL = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function formatDateCourte(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
function formatDateLongue(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

function statutBadge(statut: string) {
  if (statut === "en_cours") return <span className="rounded-full bg-green/15 px-2 py-0.5 text-[10px] font-bold text-green">En cours</span>;
  if (statut === "termine")  return <span className="rounded-full bg-gray-1 px-2 py-0.5 text-[10px] font-bold text-dark-5 dark:bg-dark-2 dark:text-dark-6">Terminé</span>;
  return null;
}

export default function ProgrammesEvangelisteClient({ sorties }: { sorties: Sortie[] }) {
  const [onglet, setOnglet] = useState<"cartes" | "calendrier">("cartes");

  // Calendrier : mois courant
  const now = new Date();
  const [moisOffset, setMoisOffset] = useState(0);
  const moisAffiche = new Date(now.getFullYear(), now.getMonth() + moisOffset, 1);
  const annee = moisAffiche.getFullYear();
  const mois = moisAffiche.getMonth(); // 0-indexed

  const moisLabel = moisAffiche.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  // Construire les cellules du calendrier
  function buildCalendrier() {
    const premier = new Date(annee, mois, 1);
    // Lundi=0 ... Dimanche=6
    const debutDecale = (premier.getDay() + 6) % 7;
    const nbJours = new Date(annee, mois + 1, 0).getDate();
    const cells: Array<{ day: number | null; sorties: (Sortie & { couleurIdx: number })[] }> = [];
    for (let i = 0; i < debutDecale; i++) cells.push({ day: null, sorties: [] });
    for (let d = 1; d <= nbJours; d++) {
      const dateStr = `${annee}-${String(mois + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({
        day: d,
        sorties: sorties
          .filter((s) => s.date === dateStr)
          .map((s, i) => ({ ...s, couleurIdx: i % COULEURS.length })),
      });
    }
    while (cells.length % 7 !== 0) cells.push({ day: null, sorties: [] });
    return cells;
  }

  const grid = buildCalendrier();
  const sortiesDuMois = sorties.filter((s) => {
    const d = new Date(s.date + "T12:00:00");
    return d.getFullYear() === annee && d.getMonth() === mois;
  });

  // Sorties à venir + en cours (pas terminées)
  const sortiesActives = sorties.filter((s) => s.statut !== "termine");
  const sortiesPassees = sorties.filter((s) => s.statut === "termine");

  return (
    <>
      {/* En-tête */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="text-sm text-dark-5 dark:text-dark-6">
          {sortiesActives.length} sortie{sortiesActives.length !== 1 ? "s" : ""} à venir
          {sortiesPassees.length > 0 && ` · ${sortiesPassees.length} terminée${sortiesPassees.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {/* Onglets */}
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl border border-stroke bg-white p-1 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <button onClick={() => setOnglet("cartes")} className={`rounded-lg py-2.5 text-sm font-semibold transition ${onglet === "cartes" ? "bg-primary text-white shadow-sm" : "text-dark-5 dark:text-dark-6"}`}>
          Sorties à venir
        </button>
        <button onClick={() => setOnglet("calendrier")} className={`rounded-lg py-2.5 text-sm font-semibold transition ${onglet === "calendrier" ? "bg-primary text-white shadow-sm" : "text-dark-5 dark:text-dark-6"}`}>
          Calendrier
        </button>
      </div>

      {/* Vue cartes */}
      {onglet === "cartes" && (
        <>
          {sorties.length === 0 ? (
            <div className="rounded-[10px] bg-white px-5 py-12 text-center shadow-1 dark:bg-gray-dark dark:shadow-card">
              <p className="text-sm text-dark-5 dark:text-dark-6">Aucun programme pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-4 sm:grid sm:grid-cols-2 sm:gap-5 sm:space-y-0 xl:grid-cols-3">
              {sorties.map((s, idx) => {
                const c = COULEURS[idx % COULEURS.length];
                return (
                  <div key={s.id} className={`overflow-hidden rounded-[10px] border-l-4 ${c.bordure} bg-white shadow-1 dark:bg-gray-dark dark:shadow-card`}>
                    <div className={`${c.couleur} flex items-center justify-between px-4 py-2.5`}>
                      <div className="flex items-center gap-2">
                        {s.statut === "en_cours" && (
                          <span className="relative flex size-2 shrink-0">
                            <span className="absolute inline-flex size-2 animate-ping rounded-full bg-white opacity-75" />
                            <span className="relative inline-flex size-2 rounded-full bg-white" />
                          </span>
                        )}
                        <span className="rounded-full bg-white/25 px-2.5 py-0.5 text-xs font-bold text-white">
                          {s.statut === "en_cours" ? "En cours" : s.statut === "termine" ? "Terminé" : "À venir"}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-white/90">{formatDateCourte(s.date)} · {s.heure}</span>
                    </div>
                    <div className="p-4">
                      <h3 className="mb-1 text-[15px] font-bold text-dark dark:text-white">{s.titre}</h3>
                      <div className="mb-3 flex items-center gap-1.5 text-sm text-dark-5 dark:text-dark-6">
                        <svg width={13} height={13} viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
                          <path fillRule="evenodd" clipRule="evenodd" d="M12 2.25C8.27 2.25 5.25 5.27 5.25 9c0 5.25 6.75 12.75 6.75 12.75S18.75 14.25 18.75 9c0-3.73-3.02-6.75-6.75-6.75zm0 9a2.25 2.25 0 110-4.5 2.25 2.25 0 010 4.5z" />
                        </svg>
                        <span className="truncate">{s.lieu}</span>
                      </div>
                      <p className="mb-3 text-xs capitalize text-dark-5 dark:text-dark-6">{formatDateLongue(s.date)}</p>

                      {/* Mon groupe si assigné */}
                      {s.monGroupeNumero !== null && (
                        <div className="mb-3 rounded-lg bg-gray-1 px-3 py-2 dark:bg-dark-2">
                          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-dark-5 dark:text-dark-6">
                            Mon groupe — Groupe {s.monGroupeNumero}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {s.monGroupeMembres.map((nom) => (
                              <span key={nom} className={`rounded-full ${c.accentBg} px-2.5 py-0.5 text-xs font-semibold ${c.accentText}`}>{nom}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tous les évangélistes */}
                      {s.evangelistes.length > 0 && (
                        <div className="mb-4">
                          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-dark-5 dark:text-dark-6">
                            Équipe · {s.evangelistes.length} pers.
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {s.evangelistes.map((ev) => (
                              <span key={ev} className="rounded-full bg-gray-1 px-2.5 py-0.5 text-xs font-medium text-dark dark:bg-dark-2 dark:text-white">{ev}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Vue calendrier */}
      {onglet === "calendrier" && (
        <div className="rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
          <div className="flex items-center justify-between border-b border-stroke px-4 py-3.5 dark:border-dark-3">
            <button onClick={() => setMoisOffset((o) => o - 1)} className="rounded-lg p-2 transition hover:bg-gray-1 dark:hover:bg-dark-2 text-dark dark:text-white">
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <h3 className="text-base font-bold capitalize text-dark dark:text-white">{moisLabel}</h3>
            <button onClick={() => setMoisOffset((o) => o + 1)} className="rounded-lg p-2 transition hover:bg-gray-1 dark:hover:bg-dark-2 text-dark dark:text-white">
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>

          {/* Entêtes jours */}
          <div className="grid grid-cols-7 border-b border-stroke dark:border-dark-3">
            {JOURS.map((j, i) => <div key={i} className="py-2.5 text-center text-xs font-bold uppercase text-dark-5 dark:text-dark-6 sm:hidden">{j}</div>)}
            {JOURS_FULL.map((j) => <div key={j} className="hidden py-2.5 text-center text-xs font-bold uppercase text-dark-5 dark:text-dark-6 sm:block">{j}</div>)}
          </div>

          <div className="grid grid-cols-7">
            {grid.map((cell, i) => {
              const isLastRow = i >= grid.length - 7;
              const isLastCol = i % 7 === 6;
              const hasSortie = cell.sorties.length > 0;
              const isToday = cell.day !== null &&
                now.getDate() === cell.day &&
                now.getMonth() === mois &&
                now.getFullYear() === annee;
              return (
                <div key={i} className={`relative p-1 sm:p-2 ${!isLastRow ? "border-b border-stroke dark:border-dark-3" : ""} ${!isLastCol ? "border-r border-stroke dark:border-dark-3" : ""} ${!cell.day ? "bg-gray-1/40 dark:bg-dark-2/20" : ""}`}>
                  {cell.day && (
                    <>
                      <span className={`flex size-6 items-center justify-center rounded-full text-xs font-semibold sm:size-7 sm:text-sm ${hasSortie ? "bg-primary text-white" : isToday ? "ring-2 ring-primary text-primary" : "text-dark dark:text-white"}`}>
                        {cell.day}
                      </span>
                      {hasSortie && (
                        <>
                          <div className="mt-1 flex justify-center gap-0.5 sm:hidden">
                            {cell.sorties.map((s) => <span key={s.id} className={`size-1.5 rounded-full ${COULEURS[s.couleurIdx].couleur}`} />)}
                          </div>
                          <div className="mt-1 hidden space-y-0.5 sm:block">
                            {cell.sorties.map((s) => (
                              <div key={s.id} className={`${COULEURS[s.couleurIdx].couleur} truncate rounded px-1.5 py-0.5 text-[11px] font-semibold text-white`} title={`${s.heure} · ${s.lieu}`}>
                                {s.titre}
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

          {/* Liste sorties du mois */}
          <div className="border-t border-stroke px-4 py-4 dark:border-dark-3">
            <p className="mb-2.5 text-xs font-bold uppercase text-dark-5 dark:text-dark-6">
              Sorties ce mois {sortiesDuMois.length === 0 && "— aucune"}
            </p>
            <div className="space-y-2">
              {sortiesDuMois.map((s, idx) => (
                <div key={s.id} className="flex items-center gap-3">
                  <span className={`size-2.5 shrink-0 rounded-full ${COULEURS[idx % COULEURS.length].couleur}`} />
                  <span className="text-sm text-dark dark:text-white">{s.titre}</span>
                  <span className="ml-auto shrink-0 text-xs text-dark-5 dark:text-dark-6">{formatDateCourte(s.date)} · {s.heure}</span>
                  {statutBadge(s.statut)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
