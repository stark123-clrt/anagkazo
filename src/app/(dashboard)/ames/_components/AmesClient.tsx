"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toggleSuiviAme, supprimerAme } from "@/actions/ames.actions";

interface Ame {
  id: string;
  nom: string;
  ville: string;
  religion: string;
  salut: boolean;
  guerison: boolean;
  priereSpontanee: boolean;
  besoinEglise: boolean;
  contact: string;
  suivi: boolean;
  groupeEquipe: string[];
  evangelisteId: string;
  evangeliste: string;
  programmeId: string | null;
  date: string;
  createdAt: string;
}

interface Stats { total: number; saluts: number; guerisons: number; aRecontacter: number; }
interface Evangeliste { id: string; nom: string; }
interface GroupeFiltre { id: string; label: string; membres: string[]; }

const RELIGION_BADGE: Record<string, string> = {
  "Chrétien(ne)": "bg-green/15 text-green",
  "Musulman(e)": "bg-[#FF9C55]/15 text-[#FF9C55]",
  "Athée / Agnostique": "bg-gray-100 text-dark-5 dark:bg-dark-2 dark:text-dark-6",
  "Autre": "bg-[#8155FF]/15 text-[#8155FF]",
};
function getBadgeReligion(r: string) { return RELIGION_BADGE[r] ?? "bg-[#8155FF]/15 text-[#8155FF]"; }

function BadgeOuiNon({ value }: { value: boolean }) {
  if (value) return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green/15 px-2 py-0.5 text-xs font-bold text-green">
      <svg width={9} height={9} viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"/></svg>
      Oui
    </span>
  );
  return <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-dark-5 dark:bg-dark-2 dark:text-dark-6">—</span>;
}

function Initiales({ nom, size = "md" }: { nom: string; size?: "sm" | "md" | "lg" }) {
  const s = size === "lg" ? "size-14 text-xl" : size === "sm" ? "size-8 text-xs" : "size-9 text-sm";
  return (
    <div className={`flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary ${s}`}>
      {nom.split(" ").map((n) => n[0]).join("").slice(0, 2)}
    </div>
  );
}

// ── Période ───────────────────────────────────────────────────
type Periode = "tout" | "aujourd_hui" | "semaine" | "mois";

function isInPeriode(createdAt: string, periode: Periode): boolean {
  if (periode === "tout") return true;
  const d = new Date(createdAt);
  const now = new Date();
  const startOf = (unit: "day" | "week" | "month") => {
    const s = new Date(now);
    if (unit === "day") { s.setHours(0, 0, 0, 0); }
    else if (unit === "week") { s.setDate(now.getDate() - now.getDay()); s.setHours(0, 0, 0, 0); }
    else { s.setDate(1); s.setHours(0, 0, 0, 0); }
    return s;
  };
  if (periode === "aujourd_hui") return d >= startOf("day");
  if (periode === "semaine") return d >= startOf("week");
  if (periode === "mois") return d >= startOf("month");
  return true;
}

// ── Modal Détail ──────────────────────────────────────────────
function ModalDetail({ ame, onClose, isAdmin, onSuiviChange, onDelete }: {
  ame: Ame; onClose: () => void; isAdmin: boolean;
  onSuiviChange: (id: string, val: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [suivi, setSuivi] = useState(ame.suivi);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  function handleToggleSuivi() {
    startTransition(async () => {
      const res = await toggleSuiviAme(ame.id);
      if (!res.error) { const v = res.suivi ?? !suivi; setSuivi(v); onSuiviChange(ame.id, v); }
    });
  }

  function handleCopy() {
    if (!ame.contact) return;
    navigator.clipboard.writeText(ame.contact).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await supprimerAme(ame.id);
      if (!res.error) { onDelete(ame.id); onClose(); }
    });
  }

  return (
    <div ref={overlayRef} onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="w-full max-w-md rounded-t-2xl bg-white p-5 dark:bg-gray-dark sm:rounded-2xl">
        {/* En-tête */}
        <div className="mb-4 flex items-start gap-3">
          <Initiales nom={ame.nom} size="lg" />
          <div className="flex-1">
            <p className="text-lg font-bold text-dark dark:text-white">{ame.nom}</p>
            <p className="text-sm text-dark-5 dark:text-dark-6">{ame.ville}</p>
            <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${getBadgeReligion(ame.religion)}`}>{ame.religion}</span>
          </div>
          <button onClick={onClose} className="text-dark-5 hover:text-dark dark:text-dark-6">
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Infos spirituelles */}
        <div className="mb-4 grid grid-cols-2 gap-2">
          {[
            { label: "Prière du Salut", value: ame.salut },
            { label: "Guérison", value: ame.guerison },
            { label: "Prière spontanée", value: ame.priereSpontanee },
            { label: "Besoin d'église", value: ame.besoinEglise },
          ].map((info) => (
            <div key={info.label} className="rounded-lg bg-gray-1 px-3 py-2 dark:bg-dark-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-dark-5 dark:text-dark-6">{info.label}</p>
              <BadgeOuiNon value={info.value} />
            </div>
          ))}
        </div>

        {/* Contact + méta */}
        <div className="mb-4 space-y-2 rounded-lg bg-gray-1 px-3 py-3 dark:bg-dark-2">
          {ame.contact && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-dark-5 dark:text-dark-6">Contact</p>
                <p className="text-sm font-semibold text-dark dark:text-white">{ame.contact}</p>
              </div>
              <button onClick={handleCopy} className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20">
                {copied ? <><svg width={12} height={12} viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"/></svg>Copié</> : <><svg width={12} height={12} viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth={2}/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth={2}/></svg>Copier</>}
              </button>
            </div>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-dark-5 dark:text-dark-6">
            <span>
              Par{" "}
              <strong className="text-dark dark:text-white">
                {ame.groupeEquipe.length > 1 ? ame.groupeEquipe.join(", ") : ame.evangeliste}
              </strong>
            </span>
            <span>{ame.date}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={handleToggleSuivi} disabled={isPending}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition disabled:opacity-60 ${suivi ? "bg-[#8155FF]/10 text-[#8155FF] hover:bg-[#8155FF]/20" : "bg-primary/10 text-primary hover:bg-primary/20"}`}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth={2} strokeLinecap="round"/>
            </svg>
            {suivi ? "Suivie" : "Marquer suivie"}
          </button>

          {isAdmin && !confirmDelete && (
            <button onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 rounded-xl bg-red/10 px-4 py-2.5 text-sm font-semibold text-red hover:bg-red/20">
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth={2} strokeLinecap="round"/></svg>
              Supprimer
            </button>
          )}
          {isAdmin && confirmDelete && (
            <div className="flex gap-1.5">
              <button onClick={handleDelete} disabled={isPending} className="rounded-xl bg-red px-3 py-2.5 text-xs font-bold text-white disabled:opacity-60">Confirmer</button>
              <button onClick={() => setConfirmDelete(false)} className="rounded-xl border border-stroke px-3 py-2.5 text-xs font-semibold text-dark dark:border-dark-3 dark:text-white">Annuler</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────
export default function AmesClient({
  ames: amesInitiales, religions, evangelistes, groupesFiltres, stats, isAdmin,
}: {
  ames: Ame[];
  religions: string[];
  evangelistes: Evangeliste[];
  groupesFiltres: GroupeFiltre[];
  stats: Stats;
  isAdmin: boolean;
}) {
  const [ames, setAmes] = useState<Ame[]>(amesInitiales);
  const [ameSelectionnee, setAmeSelectionnee] = useState<Ame | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  // ── Filtres ────────────────────────────────────────────────
  const [q, setQ] = useState("");
  const [filtrePeriode, setFiltrePeriode] = useState<Periode>("tout");
  const [filtreReligion, setFiltreReligion] = useState("Toutes");
  const [filtreSalut, setFiltreSalut] = useState("Tous");
  const [filtreEvangeliste, setFiltreEvangeliste] = useState("Tous");
  const [filtreGroupe, setFiltreGroupe] = useState("Tous");
  const [filtreSuivi, setFiltreSuivi] = useState("Tous"); // Tous / Suivies / Non suivies
  const [showFiltres, setShowFiltres] = useState(false);

  // Highlight depuis URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("highlight");
    if (!id) return;
    setHighlightId(id);
    setTimeout(() => {
      document.getElementById(`ame-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 200);
    const t = setTimeout(() => setHighlightId(null), 4000);
    return () => clearTimeout(t);
  }, []);

  // ── Application des filtres (côté client) ─────────────────
  const amesFiltrees = ames.filter((ame) => {
    if (q) {
      const qLow = q.toLowerCase();
      if (!ame.nom.toLowerCase().includes(qLow) && !ame.ville.toLowerCase().includes(qLow) && !ame.evangeliste.toLowerCase().includes(qLow)) return false;
    }
    if (!isInPeriode(ame.createdAt, filtrePeriode)) return false;
    if (filtreReligion !== "Toutes" && ame.religion !== filtreReligion) return false;
    if (filtreSalut === "Oui" && !ame.salut) return false;
    if (filtreSalut === "Non" && ame.salut) return false;
    if (filtreEvangeliste !== "Tous" && ame.evangelisteId !== filtreEvangeliste) return false;
    if (filtreGroupe !== "Tous") {
      const groupe = groupesFiltres.find((g) => g.id === filtreGroupe);
      if (!groupe || !groupe.membres.includes(ame.evangelisteId)) return false;
    }
    if (filtreSuivi === "Suivies" && !ame.suivi) return false;
    if (filtreSuivi === "Non suivies" && ame.suivi) return false;
    return true;
  });

  // ── Pagination ────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 25;

  const filtresActifs = [
    filtrePeriode !== "tout",
    filtreReligion !== "Toutes",
    filtreSalut !== "Tous",
    filtreEvangeliste !== "Tous",
    filtreGroupe !== "Tous",
    filtreSuivi !== "Tous",
  ].filter(Boolean).length;

  function resetFiltres() {
    setFiltrePeriode("tout"); setFiltreReligion("Toutes"); setFiltreSalut("Tous");
    setFiltreEvangeliste("Tous"); setFiltreGroupe("Tous"); setFiltreSuivi("Tous");
    setPage(1);
  }

  // Reset page quand les filtres changent
  useEffect(() => { setPage(1); }, [q, filtrePeriode, filtreReligion, filtreSalut, filtreEvangeliste, filtreGroupe, filtreSuivi]);

  function handleSuiviChange(id: string, val: boolean) {
    setAmes((prev) => prev.map((a) => a.id === id ? { ...a, suivi: val } : a));
    if (ameSelectionnee?.id === id) setAmeSelectionnee((prev) => prev ? { ...prev, suivi: val } : prev);
  }

  function handleDelete(id: string) { setAmes((prev) => prev.filter((a) => a.id !== id)); }

  // ── Boutons d'action inline ────────────────────────────────
  function ActionButtons({ ame }: { ame: Ame }) {
    const [copied, setCopied] = useState(false);
    const [isPending, startT] = useTransition();

    function copyContact(e: React.MouseEvent) {
      e.stopPropagation();
      navigator.clipboard.writeText(ame.contact).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
    }

    function toggleSuivi(e: React.MouseEvent) {
      e.stopPropagation();
      startT(async () => {
        const res = await toggleSuiviAme(ame.id);
        if (!res.error) handleSuiviChange(ame.id, res.suivi ?? !ame.suivi);
      });
    }

    return (
      <div className="flex items-center gap-0.5">
        <button onClick={(e) => { e.stopPropagation(); setAmeSelectionnee(ame); }} title="Voir le détail"
          className="flex size-7 items-center justify-center rounded-lg text-dark-5 hover:bg-primary/10 hover:text-primary dark:text-dark-6">
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth={2}/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth={2}/></svg>
        </button>
        {ame.contact && (
          <button onClick={copyContact} title={copied ? "Copié !" : "Copier le contact"}
            className={`flex size-7 items-center justify-center rounded-lg transition ${copied ? "text-green" : "text-dark-5 hover:bg-primary/10 hover:text-primary dark:text-dark-6"}`}>
            {copied
              ? <svg width={13} height={13} viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"/></svg>
              : <svg width={13} height={13} viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth={2}/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth={2}/></svg>
            }
          </button>
        )}
        <button onClick={toggleSuivi} disabled={isPending} title={ame.suivi ? "Marquer non suivie" : "Marquer suivie"}
          className={`flex size-7 items-center justify-center rounded-lg transition disabled:opacity-50 ${ame.suivi ? "text-[#8155FF] hover:bg-[#8155FF]/10" : "text-dark-5 hover:bg-primary/10 hover:text-primary dark:text-dark-6"}`}>
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth={2} strokeLinecap="round"/>
          </svg>
        </button>
        {isAdmin && (
          <button onClick={(e) => { e.stopPropagation(); setAmeSelectionnee(ame); }} title="Supprimer"
            className="flex size-7 items-center justify-center rounded-lg text-dark-5 hover:bg-red/10 hover:text-red dark:text-dark-6">
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth={2} strokeLinecap="round"/></svg>
          </button>
        )}
      </div>
    );
  }

  const PERIODES: { key: Periode; label: string }[] = [
    { key: "tout", label: "Tout" },
    { key: "aujourd_hui", label: "Aujourd'hui" },
    { key: "semaine", label: "Cette semaine" },
    { key: "mois", label: "Ce mois" },
  ];

  // ── Export PDF ────────────────────────────────────────────────
  function exporterPDF() {
    const isFiltred = filtresActifs > 0 || q.length > 0;
    const saluts = amesFiltrees.filter((a) => a.salut).length;
    const guerisons = amesFiltrees.filter((a) => a.guerison).length;
    const prieresSpontanees = amesFiltrees.filter((a) => a.priereSpontanee).length;
    const aRecontacter = amesFiltrees.filter((a) => a.besoinEglise && !a.suivi).length;

    const periodLabel: Record<Periode, string> = {
      tout: "Toute la période",
      aujourd_hui: "Aujourd'hui",
      semaine: "Cette semaine",
      mois: "Ce mois",
    };

    const filtresLabel = [
      isFiltred && filtrePeriode !== "tout" ? `Période : ${periodLabel[filtrePeriode]}` : null,
      filtreReligion !== "Toutes" ? `Religion : ${filtreReligion}` : null,
      filtreEvangeliste !== "Tous" ? `Évangéliste : ${evangelistes.find((e) => e.id === filtreEvangeliste)?.nom ?? filtreEvangeliste}` : null,
      filtreGroupe !== "Tous" ? `Groupe : ${groupesFiltres.find((g) => g.id === filtreGroupe)?.label ?? filtreGroupe}` : null,
      filtreSuivi !== "Tous" ? `Suivi : ${filtreSuivi}` : null,
      filtreSalut !== "Tous" ? `Salut : ${filtreSalut}` : null,
      q ? `Recherche : "${q}"` : null,
    ].filter(Boolean).join(" · ");

    const lignes = amesFiltrees.map((a) => `
      <tr>
        <td>${a.nom}</td>
        <td>${a.ville}</td>
        <td>${a.religion}</td>
        <td style="text-align:center">${a.salut ? "✓" : "—"}</td>
        <td style="text-align:center">${a.guerison ? "✓" : "—"}</td>
        <td style="text-align:center">${a.priereSpontanee ? "✓" : "—"}</td>
        <td style="text-align:center">${a.besoinEglise ? "✓" : "—"}</td>
        <td>${a.contact || "—"}</td>
        <td>${a.groupeEquipe.length > 1 ? a.groupeEquipe.join(", ") : a.evangeliste}</td>
        <td>${a.date}</td>
      </tr>
    `).join("");

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Rapport Annuaire des Âmes</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #111; padding: 24px; }
    .header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; border-bottom: 2px solid #5750F1; padding-bottom: 14px; }
    .header h1 { font-size: 20px; font-weight: 800; color: #5750F1; }
    .header .sub { font-size: 11px; color: #666; margin-top: 2px; }
    .header .date { font-size: 10px; color: #999; text-align: right; }
    .filtres { background: #f5f5fb; border: 1px solid #e0dfff; border-radius: 6px; padding: 8px 12px; margin-bottom: 16px; font-size: 10px; color: #5750F1; }
    .stats { display: flex; gap: 10px; margin-bottom: 20px; }
    .stat { flex: 1; border: 1px solid #e8e8f0; border-radius: 8px; padding: 10px 12px; }
    .stat .val { font-size: 22px; font-weight: 800; }
    .stat .lbl { font-size: 10px; color: #888; margin-top: 2px; }
    .stat.blue .val { color: #5750F1; }
    .stat.green .val { color: #22c55e; }
    .stat.orange .val { color: #FF9C55; }
    .stat.purple .val { color: #8155FF; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #5750F1; color: white; }
    thead th { padding: 7px 8px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    tbody tr:nth-child(even) { background: #f9f9fc; }
    tbody td { padding: 6px 8px; border-bottom: 1px solid #eee; vertical-align: middle; }
    .footer { margin-top: 16px; font-size: 9px; color: #bbb; text-align: center; }
    @media print { body { padding: 10px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>FIJ — Annuaire des Âmes</h1>
      <div class="sub">Fraternité Internationale de Jésus</div>
    </div>
    <div class="date">Généré le ${new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</div>
  </div>
  ${filtresLabel ? `<div class="filtres">Filtres actifs : ${filtresLabel}</div>` : ""}
  <div class="stats">
    <div class="stat blue"><div class="val">${amesFiltrees.length}</div><div class="lbl">Total Âmes</div></div>
    <div class="stat green"><div class="val">${saluts}</div><div class="lbl">Saluts</div></div>
    <div class="stat orange"><div class="val">${guerisons}</div><div class="lbl">Guérisons</div></div>
    <div class="stat purple"><div class="val">${prieresSpontanees}</div><div class="lbl">Prières spontanées</div></div>
    <div class="stat purple"><div class="val">${aRecontacter}</div><div class="lbl">À recontacter</div></div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Nom</th><th>Ville</th><th>Religion</th>
        <th>Salut</th><th>Guérison</th><th>Prière</th><th>Besoin église</th>
        <th>Contact</th><th>Évangéliste</th><th>Date</th>
      </tr>
    </thead>
    <tbody>${lignes}</tbody>
  </table>
  <div class="footer">FIJ — Rapport généré automatiquement · ${amesFiltrees.length} âme${amesFiltrees.length !== 1 ? "s" : ""}</div>
</body>
</html>`;

    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 400);
  }

  return (
    <>
      {ameSelectionnee && (
        <ModalDetail ame={ameSelectionnee} onClose={() => setAmeSelectionnee(null)}
          isAdmin={isAdmin} onSuiviChange={handleSuiviChange} onDelete={handleDelete} />
      )}

      {/* STATS — dynamiques selon les filtres actifs */}
      {(() => {
        const isFiltred = filtresActifs > 0 || q.length > 0;
        const displayStats = isFiltred
          ? {
              total: amesFiltrees.length,
              saluts: amesFiltrees.filter((a) => a.salut).length,
              guerisons: amesFiltrees.filter((a) => a.guerison).length,
              aRecontacter: amesFiltrees.filter((a) => a.besoinEglise && !a.suivi).length,
            }
          : stats;
        return (
          <div className="mb-5 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            {[
              { label: "Total Âmes", value: displayStats.total, color: "text-primary" },
              { label: "Saluts", value: displayStats.saluts, color: "text-green" },
              { label: "Guérisons", value: displayStats.guerisons, color: "text-[#FF9C55]" },
              { label: "À recontacter", value: displayStats.aRecontacter, color: "text-[#8155FF]" },
            ].map((s) => (
              <div key={s.label} className="rounded-[10px] bg-white p-4 shadow-1 dark:bg-gray-dark dark:shadow-card">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="mt-0.5 text-xs text-dark-5 dark:text-dark-6">{s.label}</p>
                {isFiltred && <p className="mt-0.5 text-[10px] text-primary">filtré</p>}
              </div>
            ))}
          </div>
        );
      })()}

      <div className="rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">

        {/* BARRE RECHERCHE */}
        <div className="flex items-center gap-3 border-b border-stroke p-4 dark:border-dark-3">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-stroke bg-gray-1 px-3 py-2.5 dark:border-dark-3 dark:bg-dark-2">
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" className="shrink-0 text-dark-5">
              <path d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" stroke="currentColor" strokeWidth={2} strokeLinecap="round"/>
            </svg>
            <input type="text" value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Nom, ville ou évangéliste..."
              className="w-full bg-transparent text-sm text-dark outline-none dark:text-white" />
            {q && (
              <button onClick={() => setQ("")}>
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"/></svg>
              </button>
            )}
          </div>
          <button onClick={() => setShowFiltres(!showFiltres)}
            className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${showFiltres || filtresActifs > 0 ? "border-primary bg-primary/10 text-primary" : "border-stroke text-dark dark:border-dark-3 dark:text-white"}`}>
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none"><path d="M3 6h18M7 12h10M11 18h2" stroke="currentColor" strokeWidth={2} strokeLinecap="round"/></svg>
            Filtres
            {filtresActifs > 0 && <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-white">{filtresActifs}</span>}
          </button>
          <button onClick={exporterPDF} title="Exporter en PDF"
            className="flex shrink-0 items-center gap-2 rounded-lg border border-stroke px-3 py-2.5 text-sm font-semibold text-dark transition hover:border-primary hover:bg-primary/10 hover:text-primary dark:border-dark-3 dark:text-white">
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none"><path d="M12 10v6m0 0l-2-2m2 2l2-2M3 15v4a2 2 0 002 2h14a2 2 0 002-2v-4M3 15V9a2 2 0 012-2h2M19 15V9a2 2 0 00-2-2h-2M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span className="hidden sm:inline">Exporter</span>
          </button>
        </div>

        {/* FILTRES PROGRESSIFS */}
        {showFiltres && (
          <div className="space-y-5 border-b border-stroke bg-gray-1/40 px-4 py-5 dark:border-dark-3 dark:bg-dark-2/20">

            {/* Période */}
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-dark-5 dark:text-dark-6">Période</p>
              <div className="flex flex-wrap gap-1.5">
                {PERIODES.map((p) => (
                  <button key={p.key} onClick={() => setFiltrePeriode(p.key)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${filtrePeriode === p.key ? "bg-primary text-white" : "border border-stroke text-dark dark:border-dark-3 dark:text-white"}`}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Évangéliste */}
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-dark-5 dark:text-dark-6">Évangéliste</p>
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => setFiltreEvangeliste("Tous")}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${filtreEvangeliste === "Tous" ? "bg-primary text-white" : "border border-stroke text-dark dark:border-dark-3 dark:text-white"}`}>
                  Tous
                </button>
                {evangelistes.map((ev) => (
                  <button key={ev.id} onClick={() => setFiltreEvangeliste(ev.id)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${filtreEvangeliste === ev.id ? "bg-primary text-white" : "border border-stroke text-dark dark:border-dark-3 dark:text-white"}`}>
                    {ev.nom}
                  </button>
                ))}
              </div>
            </div>

            {/* Groupe d'évangélisation */}
            {groupesFiltres.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-dark-5 dark:text-dark-6">Groupe de sortie</p>
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={() => setFiltreGroupe("Tous")}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${filtreGroupe === "Tous" ? "bg-primary text-white" : "border border-stroke text-dark dark:border-dark-3 dark:text-white"}`}>
                    Tous
                  </button>
                  {groupesFiltres.map((g, i) => (
                    <button key={g.id ?? `groupe-${i}`} onClick={() => setFiltreGroupe(g.id)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${filtreGroupe === g.id ? "bg-primary text-white" : "border border-stroke text-dark dark:border-dark-3 dark:text-white"}`}>
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Suivi */}
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-dark-5 dark:text-dark-6">Suivi</p>
              <div className="flex gap-1.5">
                {["Tous", "Suivies", "Non suivies"].map((s) => (
                  <button key={s} onClick={() => setFiltreSuivi(s)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${filtreSuivi === s ? "bg-primary text-white" : "border border-stroke text-dark dark:border-dark-3 dark:text-white"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Religion */}
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-dark-5 dark:text-dark-6">Religion</p>
              <div className="flex flex-wrap gap-1.5">
                {religions.map((r) => (
                  <button key={r} onClick={() => setFiltreReligion(r)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${filtreReligion === r ? "bg-primary text-white" : "border border-stroke text-dark dark:border-dark-3 dark:text-white"}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Salut */}
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-dark-5 dark:text-dark-6">Prière du Salut</p>
              <div className="flex gap-1.5">
                {["Tous", "Oui", "Non"].map((s) => (
                  <button key={s} onClick={() => setFiltreSalut(s)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${filtreSalut === s ? "bg-primary text-white" : "border border-stroke text-dark dark:border-dark-3 dark:text-white"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {filtresActifs > 0 && (
              <button onClick={resetFiltres} className="text-xs font-semibold text-red">
                ✕ Réinitialiser tous les filtres
              </button>
            )}
          </div>
        )}

        <div className="px-4 py-2">
          <p className="text-xs text-dark-5 dark:text-dark-6">
            {amesFiltrees.length} résultat{amesFiltrees.length !== 1 ? "s" : ""}
            {filtresActifs > 0 && <span className="ml-1 text-primary">· {filtresActifs} filtre{filtresActifs > 1 ? "s" : ""} actif{filtresActifs > 1 ? "s" : ""}</span>}
          </p>
        </div>
        {/* MOBILE : cartes */}
        <div className="divide-y divide-stroke dark:divide-dark-3 sm:hidden">
          {amesFiltrees.length === 0 ? (
            <p className="py-10 text-center text-sm text-dark-5 dark:text-dark-6">Aucune âme pour ces filtres.</p>
          ) : (
            amesFiltrees.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((ame) => (
              <div key={ame.id} id={`ame-${ame.id}`} onClick={() => setAmeSelectionnee(ame)}
                className={`cursor-pointer px-4 py-3.5 transition-colors duration-700 ${highlightId === ame.id ? "bg-primary/10" : ""} ${ame.suivi ? "border-l-[3px] border-l-[#8155FF]" : ""}`}>
                <div className="mb-2 flex items-start gap-3">
                  <Initiales nom={ame.nom} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-dark dark:text-white">{ame.nom}</p>
                      {ame.suivi && <span className="rounded-full bg-[#8155FF]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#8155FF]">Suivie</span>}
                    </div>
                    <p className="text-xs text-dark-5 dark:text-dark-6">
                      {ame.ville} · {ame.groupeEquipe.length > 1 ? ame.groupeEquipe.join(", ") : ame.evangeliste}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${getBadgeReligion(ame.religion)}`}>{ame.religion}</span>
                </div>
                <div className="ml-12 flex items-center justify-between">
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1 text-xs text-dark-5">Salut : <BadgeOuiNon value={ame.salut} /></div>
                    {ame.contact && <p className="text-xs text-dark-5">{ame.contact}</p>}
                  </div>
                  <div onClick={(e) => e.stopPropagation()}><ActionButtons ame={ame} /></div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* DESKTOP : tableau */}
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full">
            <thead>
              <tr className="border-y border-stroke bg-gray-1/50 text-left text-xs font-bold uppercase tracking-wide text-dark-5 dark:border-dark-3 dark:bg-dark-2/30 dark:text-dark-6">
                <th className="px-5 py-3.5">Nom & Prénom</th>
                <th className="px-4 py-3.5">Ville</th>
                <th className="px-4 py-3.5">Religion</th>
                <th className="px-4 py-3.5">Salut</th>
                <th className="px-4 py-3.5">Guérison</th>
                <th className="px-4 py-3.5">Contact</th>
                <th className="px-4 py-3.5">Contacté par</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke dark:divide-dark-3">
              {amesFiltrees.length === 0 ? (
                <tr><td colSpan={9} className="py-12 text-center text-sm text-dark-5 dark:text-dark-6">Aucune âme pour ces filtres.</td></tr>
              ) : (
                amesFiltrees.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((ame) => (
                  <tr key={ame.id} id={`ame-${ame.id}`} onClick={() => setAmeSelectionnee(ame)}
                    className={`cursor-pointer text-sm transition-colors duration-700 hover:bg-gray-1 dark:hover:bg-dark-2 ${highlightId === ame.id ? "bg-primary/10" : ""} ${ame.suivi ? "border-l-[3px] border-l-[#8155FF]" : ""}`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Initiales nom={ame.nom} size="sm" />
                        <div>
                          <p className="font-semibold text-dark dark:text-white">{ame.nom}</p>
                          {ame.suivi && <span className="text-[9px] font-bold text-[#8155FF]">Suivie</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-dark-5 dark:text-dark-6">{ame.ville}</td>
                    <td className="px-4 py-3.5"><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${getBadgeReligion(ame.religion)}`}>{ame.religion}</span></td>
                    <td className="px-4 py-3.5"><BadgeOuiNon value={ame.salut} /></td>
                    <td className="px-4 py-3.5"><BadgeOuiNon value={ame.guerison} /></td>
                    <td className="px-4 py-3.5 text-dark-5 dark:text-dark-6">{ame.contact || "—"}</td>
                    <td className="px-4 py-3.5">
                      {ame.groupeEquipe.length > 1 ? (
                        <div className="flex flex-wrap gap-1">
                          {ame.groupeEquipe.map((nom) => (
                            <span key={nom} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{nom}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="rounded-full bg-gray-1 px-2.5 py-1 text-xs font-medium text-dark dark:bg-dark-2 dark:text-white">{ame.evangeliste}</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-dark-5 dark:text-dark-6">{ame.date}</td>
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}><ActionButtons ame={ame} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {(() => {
          const totalPages = Math.ceil(amesFiltrees.length / PAGE_SIZE);
          if (totalPages <= 1) return (
            <div className="border-t border-stroke px-4 py-3.5 dark:border-dark-3">
              <p className="text-xs text-dark-5 dark:text-dark-6">
                {amesFiltrees.length} résultat{amesFiltrees.length !== 1 ? "s" : ""} · {stats.total} âme{stats.total !== 1 ? "s" : ""} au total
              </p>
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
    </>
  );
}
