"use client";

import { useState, useEffect, useTransition } from "react";
import { creerProgramme, modifierProgramme } from "@/actions/programme.actions";

interface Evangeliste {
  id: string;
  nom: string;
}

interface DonneesInitiales {
  id: string;
  titre: string;
  lieu: string;
  date: string;       // "2026-04-17"
  heureDebut: string; // "14:00"
  heureFin: string;   // "16:00"
  statut: string;
  groupes: { groupe: number; membres: string[] }[];
}

const GROUPE_STYLES = [
  { bg: "bg-primary/10",   border: "border-l-primary",    text: "text-primary",    badge: "bg-primary/15 text-primary"     },
  { bg: "bg-green/10",     border: "border-l-green",      text: "text-green",      badge: "bg-green/15 text-green"         },
  { bg: "bg-[#FF9C55]/10", border: "border-l-[#FF9C55]",  text: "text-[#FF9C55]", badge: "bg-[#FF9C55]/15 text-[#FF9C55]" },
  { bg: "bg-[#8155FF]/10", border: "border-l-[#8155FF]",  text: "text-[#8155FF]", badge: "bg-[#8155FF]/15 text-[#8155FF]" },
  { bg: "bg-rose-500/10",  border: "border-l-rose-500",   text: "text-rose-400",   badge: "bg-rose-500/15 text-rose-300"   },
];

function getStyle(groupeNum: number) {
  return GROUPE_STYLES[(groupeNum - 1) % GROUPE_STYLES.length];
}

function formatDateFr(dateStr: string) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
}

const inputClass =
  "w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:text-white dark:focus:border-primary";

// Reconstruire le flat array ordonné depuis les groupes sauvegardés
function buildSelectionnesInitiaux(initial?: DonneesInitiales): string[] {
  if (!initial?.groupes?.length) return [];
  return [...initial.groupes]
    .sort((a, b) => a.groupe - b.groupe)
    .flatMap((g) => g.membres);
}

// Déduire la taille de groupe depuis les groupes sauvegardés
function buildTailleInitiale(initial?: DonneesInitiales): number {
  if (!initial?.groupes?.length) return 2;
  // On prend la taille du premier groupe comme référence
  return initial.groupes[0].membres.length || 2;
}

export default function NouveauProgrammeForm({
  evangelistes,
  initial,
}: {
  evangelistes: Evangeliste[];
  initial?: DonneesInitiales;
}) {
  const modeModif = !!initial;

  const [form, setForm] = useState({
    titre: initial?.titre ?? "",
    titreAuto: !initial,
    date: initial?.date ?? "",
    heureDebut: initial?.heureDebut ?? "",
    heureFin: initial?.heureFin ?? "",
    lieu: initial?.lieu ?? "",
    statut: initial?.statut ?? "a_venir",
    tailleGroupe: buildTailleInitiale(initial),
  });

  // Flat array des sélectionnés dans l'ordre — même logique création et modification
  const [selectionnes, setSelectionnes] = useState<string[]>(() => buildSelectionnesInitiaux(initial));
  const [erreur, setErreur] = useState("");
  const [isPending, startTransition] = useTransition();

  // Titre auto (création seulement)
  useEffect(() => {
    if (!form.titreAuto) return;
    const parts: string[] = [];
    parts.push(form.lieu ? `Évangélisation – ${form.lieu}` : "Évangélisation");
    if (form.date) parts.push(formatDateFr(form.date));
    setForm((prev) => ({ ...prev, titre: parts.join(" · ") }));
  }, [form.lieu, form.date, form.titreAuto]);

  function toggleEvangeliste(id: string) {
    setSelectionnes((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function getNumeroGroupe(index: number) {
    return Math.floor(index / form.tailleGroupe) + 1;
  }

  const nbGroupes = selectionnes.length > 0
    ? Math.ceil(selectionnes.length / form.tailleGroupe)
    : 0;

  function buildGroupes() {
    return Array.from({ length: nbGroupes }, (_, gi) => ({
      groupe: gi + 1,
      membres: selectionnes
        .map((id, idx) => ({ id, idx }))
        .filter(({ idx }) => Math.floor(idx / form.tailleGroupe) === gi)
        .map(({ id }) => id),
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");

    if (!form.lieu.trim() || !form.date || !form.heureDebut) {
      setErreur("Lieu, date et heure de début sont requis.");
      return;
    }

    startTransition(async () => {
      if (modeModif && initial) {
        const result = await modifierProgramme(initial.id, {
          titre: form.titre,
          lieu: form.lieu,
          date: form.date,
          heureDebut: form.heureDebut,
          heureFin: form.heureFin,
          groupes: buildGroupes(),
          statut: form.statut,
        });
        if (result?.error) {
          setErreur(result.error);
        } else {
          window.location.href = "/programmes";
        }
      } else {
        const result = await creerProgramme({
          titre: form.titre,
          lieu: form.lieu,
          date: form.date,
          heureDebut: form.heureDebut,
          heureFin: form.heureFin,
          groupes: buildGroupes(),
        });
        if (result?.error) setErreur(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6 pb-10">

      {erreur && (
        <div className="flex items-center gap-2.5 rounded-xl border border-red/30 bg-red/10 px-4 py-3">
          <svg width={15} height={15} viewBox="0 0 24 24" fill="none" className="shrink-0 text-red">
            <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
          </svg>
          <p className="text-sm font-medium text-red">{erreur}</p>
        </div>
      )}

      {/* ===== INFOS DE BASE ===== */}
      <div className="rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
        <div className="border-b border-stroke px-6 py-4 dark:border-dark-3">
          <h2 className="font-bold text-dark dark:text-white">Informations de la sortie</h2>
        </div>
        <div className="space-y-4 p-6">

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-dark dark:text-white">
              Lieu <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="ex : Paris 18ème – Marché Barbès"
              value={form.lieu}
              onChange={(e) => setForm({ ...form, lieu: e.target.value })}
              className={inputClass}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-dark dark:text-white">
                Date <span className="text-red-500">*</span>
              </label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputClass} required />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-dark dark:text-white">
                Heure début <span className="text-red-500">*</span>
              </label>
              <input type="time" value={form.heureDebut} onChange={(e) => setForm({ ...form, heureDebut: e.target.value })} className={inputClass} required />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-dark dark:text-white">Heure fin</label>
              <input type="time" value={form.heureFin} onChange={(e) => setForm({ ...form, heureFin: e.target.value })} className={inputClass} />
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-semibold text-dark dark:text-white">
                Titre <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, titreAuto: !prev.titreAuto }))}
                className="text-xs font-medium text-primary hover:underline"
              >
                {form.titreAuto ? "Modifier manuellement" : "Générer automatiquement"}
              </button>
            </div>
            <input
              type="text"
              value={form.titre}
              readOnly={form.titreAuto}
              onChange={(e) => setForm({ ...form, titre: e.target.value })}
              className={`${inputClass} ${form.titreAuto ? "cursor-default opacity-70" : ""}`}
              placeholder="Renseignez le lieu et la date ci-dessus"
              required
            />
            {form.titreAuto && (
              <p className="mt-1 text-xs text-dark-5 dark:text-dark-6">Généré automatiquement depuis le lieu et la date.</p>
            )}
          </div>

          {/* Statut — visible en mode modification uniquement */}
          {modeModif && (
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-dark dark:text-white">Statut</label>
              <div className="relative">
                <select
                  value={form.statut}
                  onChange={(e) => setForm({ ...form, statut: e.target.value })}
                  className={`${inputClass} appearance-none pr-10`}
                >
                  <option value="a_venir">À venir</option>
                  <option value="en_cours">En cours</option>
                  <option value="termine">Terminé</option>
                </select>
                <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-dark-5" width={14} height={14} viewBox="0 0 24 24" fill="none">
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== TAILLE DES GROUPES ===== */}
      <div className="rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
        <div className="border-b border-stroke px-6 py-4 dark:border-dark-3">
          <h2 className="font-bold text-dark dark:text-white">Paramètre des groupes</h2>
        </div>
        <div className="p-6">
          <label className="mb-1.5 block text-sm font-semibold text-dark dark:text-white">
            Évangélistes par groupe
          </label>
          <div className="flex items-center gap-4">
            <input
              type="number"
              min={1}
              max={10}
              value={form.tailleGroupe}
              onChange={(e) => setForm({ ...form, tailleGroupe: Math.max(1, parseInt(e.target.value) || 1) })}
              className={`${inputClass} w-24 text-center text-lg font-bold`}
            />
            <p className="text-sm text-dark-5 dark:text-dark-6">
              {selectionnes.length > 0
                ? `${selectionnes.length} évangéliste${selectionnes.length > 1 ? "s" : ""} → ${nbGroupes} groupe${nbGroupes > 1 ? "s" : ""}`
                : "Sélectionnez des évangélistes ci-dessous"}
            </p>
          </div>
        </div>
      </div>

      {/* ===== SÉLECTION ÉVANGÉLISTES ===== */}
      <div className="rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
        <div className="border-b border-stroke px-6 py-4 dark:border-dark-3">
          <h2 className="font-bold text-dark dark:text-white">Évangélistes disponibles</h2>
          <p className="mt-0.5 text-xs text-dark-5 dark:text-dark-6">
            Cliquez pour sélectionner ou désélectionner — l&apos;ordre détermine les groupes
          </p>
        </div>

        {evangelistes.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-dark-5 dark:text-dark-6">
              Aucun évangéliste dans votre équipe.{" "}
              <a href="/equipe" className="font-semibold text-primary hover:underline">Invitez-en un →</a>
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stroke dark:divide-dark-3">
            {evangelistes.map((ev) => {
              const indexSel = selectionnes.indexOf(ev.id);
              const estSelectionne = indexSel !== -1;
              const numGroupe = estSelectionne ? getNumeroGroupe(indexSel) : null;
              const style = numGroupe ? getStyle(numGroupe) : null;

              return (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => toggleEvangeliste(ev.id)}
                  className={`flex w-full items-center gap-4 border-l-4 px-6 py-3.5 text-left transition ${
                    estSelectionne
                      ? `${style!.bg} ${style!.border}`
                      : "border-l-transparent hover:bg-gray-1 dark:hover:bg-dark-2"
                  }`}
                >
                  <div className={`flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    estSelectionne ? style!.badge : "bg-gray-2 text-dark-5 dark:bg-dark-3 dark:text-dark-6"
                  }`}>
                    {ev.nom.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <span className={`flex-1 text-sm font-semibold ${estSelectionne ? style!.text : "text-dark dark:text-white"}`}>
                    {ev.nom}
                  </span>
                  {estSelectionne && numGroupe ? (
                    <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${style!.badge}`}>
                      Groupe {numGroupe}
                    </span>
                  ) : (
                    <span className="text-xs text-dark-5 dark:text-dark-6">+ Ajouter</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ===== RÉPARTITION VISUELLE ===== */}
      {selectionnes.length > 0 && (
        <div className="rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
          <div className="border-b border-stroke px-6 py-4 dark:border-dark-3">
            <h2 className="font-bold text-dark dark:text-white">
              Répartition — {nbGroupes} groupe{nbGroupes > 1 ? "s" : ""}
            </h2>
            <p className="mt-0.5 text-xs text-dark-5 dark:text-dark-6">
              Telle qu&apos;elle sera enregistrée
            </p>
          </div>
          <div className="space-y-3 p-6">
            {Array.from({ length: nbGroupes }, (_, gi) => {
              const style = getStyle(gi + 1);
              const membres = selectionnes
                .map((id, idx) => ({ id, idx }))
                .filter(({ idx }) => Math.floor(idx / form.tailleGroupe) === gi)
                .map(({ id }) => evangelistes.find((e) => e.id === id)!);

              return (
                <div key={gi} className={`flex items-center gap-4 rounded-xl border-l-4 ${style.border} ${style.bg} px-4 py-3.5`}>
                  <div className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${style.badge}`}>
                    {gi + 1}
                  </div>
                  <div className="flex flex-1 flex-wrap gap-2">
                    {membres.map((m) => m && (
                      <span key={m.id} className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.badge}`}>
                        {m.nom}
                      </span>
                    ))}
                  </div>
                  <span className={`shrink-0 text-xs font-bold ${style.text}`}>
                    {membres.length} pers.
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== BOUTONS ===== */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isPending || !form.lieu.trim() || !form.date}
          className="flex-1 rounded-xl bg-primary py-4 text-sm font-bold text-white shadow-md transition hover:bg-primary/90 disabled:opacity-60 sm:flex-none sm:px-10"
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin" width={16} height={16} viewBox="0 0 24 24" fill="none">
                <circle cx={12} cy={12} r={10} stroke="currentColor" strokeWidth={3} strokeDasharray="60" strokeDashoffset="20" />
              </svg>
              Enregistrement…
            </span>
          ) : modeModif ? "Sauvegarder les modifications" : "Enregistrer le programme"}
        </button>
        <a href="/programmes" className="text-sm font-medium text-dark-5 hover:text-dark dark:text-dark-6 dark:hover:text-white">
          Annuler
        </a>
      </div>

    </form>
  );
}
