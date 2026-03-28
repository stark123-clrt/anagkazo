"use client";

import { useState } from "react";
import Link from "next/link";

interface Ame {
  id: string;
  nom: string;
  ville: string;
  religion: string;
  salut: boolean;
  guerison: boolean;
  priereSpontanee: boolean;
  contact: string;
  suivi: boolean;
  groupeEquipe: string[];
  date: string;
}

interface Stats {
  total: number;
  saluts: number;
  guerisons: number;
  aRecontacter: number;
}

function Avatar({ nom }: { nom: string }) {
  return (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
      {nom.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
    </div>
  );
}

function CopierBtn({ texte }: { texte: string }) {
  const [copie, setCopie] = useState(false);
  if (!texte) return null;
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(texte); setCopie(true); setTimeout(() => setCopie(false), 2000); }}
      className="ml-1 text-dark-5 transition hover:text-primary"
      title="Copier le contact"
    >
      {copie
        ? <svg width={13} height={13} viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#22AD5C" strokeWidth={2} strokeLinecap="round" /></svg>
        : <svg width={13} height={13} viewBox="0 0 24 24" fill="none"><path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3" stroke="currentColor" strokeWidth={2} strokeLinecap="round" /></svg>
      }
    </button>
  );
}

export default function AmesEvangelisteClient({
  ames, religions, stats,
}: { ames: Ame[]; religions: string[]; stats: Stats }) {
  const [recherche, setRecherche] = useState("");
  const [filtreReligion, setFiltreReligion] = useState("Toutes");
  const [filtreSalut, setFiltreSalut] = useState("Tous");
  const [showFiltres, setShowFiltres] = useState(false);
  const [selected, setSelected] = useState<Ame | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 25;

  const filtresActifs = (filtreReligion !== "Toutes" ? 1 : 0) + (filtreSalut !== "Tous" ? 1 : 0);

  const amesFiltrees = ames.filter((a) => {
    const matchRecherche = a.nom.toLowerCase().includes(recherche.toLowerCase()) || a.ville.toLowerCase().includes(recherche.toLowerCase());
    const matchReligion = filtreReligion === "Toutes" || a.religion === filtreReligion;
    const matchSalut = filtreSalut === "Tous" || (filtreSalut === "Oui" ? a.salut : !a.salut);
    return matchRecherche && matchReligion && matchSalut;
  });

  return (
    <>
      {/* Stats */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {[
          { label: "Total Âmes",   value: stats.total,        color: "text-primary"   },
          { label: "Saluts",       value: stats.saluts,       color: "text-green"     },
          { label: "Guérisons",    value: stats.guerisons,    color: "text-[#FF9C55]" },
          { label: "À recontacter",value: stats.aRecontacter, color: "text-[#8155FF]" },
        ].map((s) => (
          <div key={s.label} className="rounded-[10px] bg-white p-4 shadow-1 dark:bg-gray-dark dark:shadow-card">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="mt-0.5 text-xs text-dark-5 dark:text-dark-6">{s.label}</p>
          </div>
        ))}
      </div>

      {/* CTA si aucune âme */}
      {ames.length === 0 && (
        <div className="rounded-[10px] bg-white px-5 py-12 text-center shadow-1 dark:bg-gray-dark dark:shadow-card">
          <p className="text-sm text-dark-5 dark:text-dark-6">Tu n&apos;as pas encore enregistré d&apos;âmes.</p>
          <Link href="/evangeliste/terrain" className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">
            Enregistrer une rencontre →
          </Link>
        </div>
      )}

      {ames.length > 0 && (
        <div className="rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
          {/* Barre recherche + filtres */}
          <div className="space-y-3 border-b border-stroke p-4 dark:border-dark-3 sm:flex sm:items-center sm:gap-3 sm:space-y-0">
            <div className="flex items-center gap-2 rounded-lg border border-stroke bg-gray-1 px-3 py-2.5 dark:border-dark-3 dark:bg-dark-2 sm:flex-1">
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none" className="shrink-0 text-dark-5">
                <path d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
              </svg>
              <input type="text" value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Nom ou ville..." className="w-full bg-transparent text-sm text-dark outline-none dark:text-white" />
              {recherche && <button onClick={() => setRecherche("")} className="text-dark-5"><svg width={13} height={13} viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" /></svg></button>}
            </div>
            <button
              onClick={() => setShowFiltres(!showFiltres)}
              className={`flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition sm:w-auto ${showFiltres || filtresActifs > 0 ? "border-primary bg-primary/10 text-primary" : "border-stroke text-dark dark:border-dark-3 dark:text-white"}`}
            >
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none"><path d="M3 6h18M7 12h10M11 18h2" stroke="currentColor" strokeWidth={2} strokeLinecap="round" /></svg>
              Filtrer
              {filtresActifs > 0 && <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-white">{filtresActifs}</span>}
            </button>
          </div>

          {showFiltres && (
            <div className="space-y-4 border-b border-stroke bg-gray-1/40 px-4 py-4 dark:border-dark-3 dark:bg-dark-2/20">
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-dark-5 dark:text-dark-6">Religion</p>
                <div className="flex flex-wrap gap-1.5">
                  {religions.map((r) => (
                    <button key={r} onClick={() => setFiltreReligion(r)} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${filtreReligion === r ? "bg-primary text-white" : "border border-stroke text-dark dark:border-dark-3 dark:text-white"}`}>{r}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-dark-5 dark:text-dark-6">Salut</p>
                <div className="flex gap-1.5">
                  {["Tous", "Oui", "Non"].map((v) => (
                    <button key={v} onClick={() => setFiltreSalut(v)} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${filtreSalut === v ? "bg-primary text-white" : "border border-stroke text-dark dark:border-dark-3 dark:text-white"}`}>{v}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Liste mobile */}
          <div className="divide-y divide-stroke dark:divide-dark-3 sm:hidden">
            {amesFiltrees.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-dark-5 dark:text-dark-6">Aucun résultat</p>
            ) : amesFiltrees.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((a) => (
              <button key={a.id} onClick={() => setSelected(a)} className="w-full p-4 text-left transition hover:bg-gray-1/50 dark:hover:bg-dark-2/30">
                <div className="mb-2 flex items-start gap-3">
                  <Avatar nom={a.nom} />
                  <div className="flex-1">
                    <p className="font-semibold text-dark dark:text-white">{a.nom}</p>
                    <p className="text-xs text-dark-5 dark:text-dark-6">{a.ville} · {a.religion}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {a.salut && <span className="rounded-full bg-green/10 px-2 py-0.5 text-[10px] font-bold text-green">Salut</span>}
                    {a.guerison && <span className="rounded-full bg-[#FF9C55]/10 px-2 py-0.5 text-[10px] font-bold text-[#FF9C55]">Guérison</span>}
                    {a.suivi && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">Suivi</span>}
                  </div>
                </div>
                <p className="text-xs text-dark-5 dark:text-dark-6">{a.date}</p>
              </button>
            ))}
          </div>

          {/* Tableau desktop */}
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stroke dark:border-dark-3">
                  {["Nom", "Ville", "Religion", "Contact", "Statut", "Date"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase text-dark-5 dark:text-dark-6">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke dark:divide-dark-3">
                {amesFiltrees.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-dark-5 dark:text-dark-6">Aucun résultat</td></tr>
                ) : amesFiltrees.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((a) => (
                  <tr key={a.id} onClick={() => setSelected(a)} className="cursor-pointer hover:bg-gray-1/50 dark:hover:bg-dark-2/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar nom={a.nom} />
                        <div>
                          <span className="font-medium text-dark dark:text-white">{a.nom}</span>
                          {a.suivi && <span className="ml-2 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">Suivi</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-dark-5 dark:text-dark-6">{a.ville}</td>
                    <td className="px-4 py-3 text-dark-5 dark:text-dark-6">{a.religion}</td>
                    <td className="px-4 py-3">
                      {a.contact ? (
                        <div className="flex items-center text-dark-5 dark:text-dark-6">
                          <span className="text-xs">{a.contact}</span>
                          <CopierBtn texte={a.contact} />
                        </div>
                      ) : <span className="text-xs text-dark-5 dark:text-dark-6">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {a.salut && <span className="rounded-full bg-green/10 px-2 py-0.5 text-xs font-bold text-green">Salut</span>}
                        {a.guerison && <span className="rounded-full bg-[#FF9C55]/10 px-2 py-0.5 text-xs font-bold text-[#FF9C55]">Guérison</span>}
                        {!a.salut && !a.guerison && a.priereSpontanee && <span className="rounded-full bg-[#8155FF]/10 px-2 py-0.5 text-xs font-bold text-[#8155FF]">Prière</span>}
                        {!a.salut && !a.guerison && !a.priereSpontanee && <span className="rounded-full bg-gray-1 px-2 py-0.5 text-xs text-dark-5 dark:bg-dark-2 dark:text-dark-6">Contact</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-dark-5 dark:text-dark-6">{a.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(() => {
            const totalPages = Math.ceil(amesFiltrees.length / PAGE_SIZE);
            if (totalPages <= 1) return (
              <div className="border-t border-stroke px-4 py-3 text-xs text-dark-5 dark:border-dark-3 dark:text-dark-6">
                {amesFiltrees.length} résultat{amesFiltrees.length !== 1 ? "s" : ""} · {stats.total} âme{stats.total !== 1 ? "s" : ""} au total
              </div>
            );
            return (
              <div className="flex items-center justify-between border-t border-stroke px-4 py-3.5 dark:border-dark-3">
                <p className="text-xs text-dark-5 dark:text-dark-6">
                  {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, amesFiltrees.length)} sur {amesFiltrees.length}
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                    className="flex size-7 items-center justify-center rounded-lg border border-stroke text-dark-5 disabled:opacity-30 hover:bg-gray-1 dark:border-dark-3 dark:text-dark-6 dark:hover:bg-dark-2">
                    <svg width={13} height={13} viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth={2} strokeLinecap="round"/></svg>
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .reduce<(number | "...")[]>((acc, p, i, arr) => {
                      if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) =>
                      p === "..." ? (
                        <span key={`ellipsis-${i}`} className="px-1 text-xs text-dark-5">…</span>
                      ) : (
                        <button key={p} onClick={() => setPage(p as number)}
                          className={`flex size-7 items-center justify-center rounded-lg text-xs font-semibold transition ${page === p ? "bg-primary text-white" : "border border-stroke text-dark hover:bg-gray-1 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2"}`}>
                          {p}
                        </button>
                      )
                    )}
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="flex size-7 items-center justify-center rounded-lg border border-stroke text-dark-5 disabled:opacity-30 hover:bg-gray-1 dark:border-dark-3 dark:text-dark-6 dark:hover:bg-dark-2">
                    <svg width={13} height={13} viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth={2} strokeLinecap="round"/></svg>
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Modal détail */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={() => setSelected(null)}>
          <div className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-2 dark:bg-gray-dark sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start gap-3">
              <Avatar nom={selected.nom} />
              <div className="flex-1">
                <h3 className="font-bold text-dark dark:text-white">{selected.nom}</h3>
                <p className="text-xs text-dark-5 dark:text-dark-6">{selected.ville} · {selected.religion}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-dark-5">
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth={2} strokeLinecap="round" /></svg>
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-dark-5 dark:text-dark-6">Date</span>
                <span className="font-medium text-dark dark:text-white">{selected.date}</span>
              </div>
              {selected.contact && (
                <div className="flex justify-between">
                  <span className="text-dark-5 dark:text-dark-6">Contact</span>
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-dark dark:text-white">{selected.contact}</span>
                    <CopierBtn texte={selected.contact} />
                  </div>
                </div>
              )}
              {selected.groupeEquipe.length > 1 && (
                <div className="flex justify-between gap-4">
                  <span className="shrink-0 text-dark-5 dark:text-dark-6">Contacté par</span>
                  <span className="text-right font-medium text-dark dark:text-white">{selected.groupeEquipe.join(", ")}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-dark-5 dark:text-dark-6">Suivi</span>
                <span className={`font-semibold ${selected.suivi ? "text-green" : "text-dark-5 dark:text-dark-6"}`}>{selected.suivi ? "Oui" : "Non"}</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {selected.salut && <span className="rounded-full bg-green/10 px-3 py-1 text-xs font-bold text-green">Salut ✓</span>}
              {selected.guerison && <span className="rounded-full bg-[#FF9C55]/10 px-3 py-1 text-xs font-bold text-[#FF9C55]">Guérison ✓</span>}
              {selected.priereSpontanee && <span className="rounded-full bg-[#8155FF]/10 px-3 py-1 text-xs font-bold text-[#8155FF]">Prière spontanée ✓</span>}
            </div>

            <button onClick={() => setSelected(null)} className="mt-4 w-full rounded-xl border border-stroke py-2.5 text-sm font-semibold text-dark dark:border-dark-3 dark:text-white">
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
}
