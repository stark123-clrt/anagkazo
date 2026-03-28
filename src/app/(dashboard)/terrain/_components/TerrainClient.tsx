"use client";

import { sauvegarderRencontre } from "@/actions/rencontre.actions";
import { useEffect, useRef, useState, useTransition } from "react";

interface SortieInfo {
  id: string;
  titre: string;
  lieu: string;
  heureDebut: string;
  statut: string;
  groupeNumero: number | null;
  coequipiers: string[];
  tousGroupes: { groupe: number; noms: string[] }[];
}

const RELIGIONS = [
  "Chrétien(ne)", "Musulman(e)", "Athée / Agnostique",
  "Juif / Juive", "Bouddhiste", "Hindou(e)", "Autre", "Non précisé",
];

type OuiNon = "oui" | "non" | null;

interface VilleSuggestion { nom: string; codePostal: string; lat: number; lon: number; }

interface FormState {
  nom: string; ville: string; villeLat: number | null; villeLon: number | null;
  religion: string; veutPriere: OuiNon; guerison: OuiNon; salut: OuiNon;
  besoinEglise: OuiNon; telephone: string; reseaux: string; notes: string;
}

const FORM_VIDE: FormState = {
  nom: "", ville: "", villeLat: null, villeLon: null, religion: "",
  veutPriere: null, guerison: null, salut: null, besoinEglise: null,
  telephone: "", reseaux: "", notes: "",
};

function BoutonOuiNon({ valeur, onChange }: { valeur: OuiNon; onChange: (v: OuiNon) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button type="button" onClick={() => onChange(valeur === "oui" ? null : "oui")}
        className={`rounded-xl py-4 text-base font-bold transition active:scale-95 ${valeur === "oui" ? "bg-green text-white shadow-md" : "border-2 border-stroke bg-white text-dark dark:border-dark-3 dark:bg-gray-dark dark:text-white"}`}>
        ✓ Oui
      </button>
      <button type="button" onClick={() => onChange(valeur === "non" ? null : "non")}
        className={`rounded-xl py-4 text-base font-bold transition active:scale-95 ${valeur === "non" ? "bg-red-500 text-white shadow-md" : "border-2 border-stroke bg-white text-dark dark:border-dark-3 dark:bg-gray-dark dark:text-white"}`}>
        ✗ Non
      </button>
    </div>
  );
}

function Section({ titre, children, accent }: { titre: string; children: React.ReactNode; accent?: string }) {
  return (
    <div className={`rounded-[10px] border-l-4 ${accent ?? "border-l-primary"} bg-white shadow-1 dark:bg-gray-dark dark:shadow-card`}>
      <div className="border-b border-stroke px-4 py-3 dark:border-dark-3">
        <p className="text-xs font-bold uppercase tracking-wide text-dark-5 dark:text-dark-6">{titre}</p>
      </div>
      <div className="space-y-5 p-4">{children}</div>
    </div>
  );
}

function Champ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-dark dark:text-white">
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass = "w-full rounded-xl border-2 border-stroke bg-transparent px-4 py-4 text-base text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:text-white dark:focus:border-primary";

export default function TerrainClient({ sortie, monNom }: { sortie: SortieInfo | null; monNom: string }) {
  const [form, setForm] = useState<FormState>(FORM_VIDE);
  const [statut, setStatut] = useState<"idle" | "succes" | "erreur">("idle");
  const [erreurMsg, setErreurMsg] = useState("");
  const [isPending, startTransition] = useTransition();
  const [suggestions, setSuggestions] = useState<VilleSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const villeRef = useRef<HTMLDivElement>(null);

  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (villeRef.current && !villeRef.current.contains(e.target as Node)) setShowSuggestions(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function handleVilleChange(value: string) {
    set("ville", value); set("villeLat", null); set("villeLon", null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 2) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(value)}&fields=nom,codesPostaux,centre&limit=6&boost=population`);
        const data = await res.json();
        setSuggestions((data as Array<{ nom: string; codesPostaux: string[]; centre: { coordinates: [number, number] } }>).map((c) => ({
          nom: c.nom, codePostal: c.codesPostaux?.[0] ?? "", lat: c.centre.coordinates[1], lon: c.centre.coordinates[0],
        })));
        setShowSuggestions(true);
      } catch { setSuggestions([]); }
    }, 300);
  }

  function selectVille(v: VilleSuggestion) {
    setForm((prev) => ({ ...prev, ville: v.nom, villeLat: v.lat, villeLon: v.lon }));
    setSuggestions([]); setShowSuggestions(false);
  }

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!form.nom.trim() || !form.ville.trim()) return;
    setStatut("idle"); setErreurMsg("");
    startTransition(async () => {
      const result = await sauvegarderRencontre({
        personneNom: form.nom, personneVille: form.ville,
        latitude: form.villeLat, longitude: form.villeLon,
        religion: form.religion,
        priereSpontanee: form.veutPriere === "oui",
        guerison: form.guerison === "oui",
        priereSalut: form.salut === "oui",
        besoinEglise: form.besoinEglise === "oui",
        contact: [form.telephone, form.reseaux].filter(Boolean).join(" · ") || null,
        programmeId: sortie?.statut === "en_cours" ? sortie.id : null,
        groupeEquipe: sortie?.statut === "en_cours" && sortie.groupeNumero !== null
          ? [monNom, ...sortie.coequipiers]
          : undefined,
      });
      if (result.success) {
        setStatut("succes"); setForm(FORM_VIDE); setSuggestions([]);
        setTimeout(() => setStatut("idle"), 5000);
      } else {
        setStatut("erreur"); setErreurMsg(result.error ?? "Erreur inconnue.");
      }
    });
  }

  return (
    <>
      {/* ===== BANNIÈRE PROGRAMME ===== */}
      {sortie && (
        <div className={`mb-5 overflow-hidden rounded-[10px] border-l-4 ${sortie.statut === "en_cours" ? "border-l-green" : "border-l-blue-500"} bg-white shadow-1 dark:bg-gray-dark dark:shadow-card`}>
          {/* En-tête */}
          <div className={`flex items-center gap-3 px-4 py-3 ${sortie.statut === "en_cours" ? "bg-green/10" : "bg-blue-500/10"}`}>
            {sortie.statut === "en_cours" ? (
              <>
                <span className="relative flex size-2.5 shrink-0">
                  <span className="absolute inline-flex size-2.5 animate-ping rounded-full bg-green opacity-75" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-green" />
                </span>
                <p className="font-bold text-green">Sortie en cours</p>
              </>
            ) : (
              <>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" className="shrink-0 text-blue-500">
                  <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="font-bold text-blue-500">Programme du jour</p>
              </>
            )}
          </div>

          {/* Détails */}
          <div className="px-4 py-4">
            <p className="mb-1 font-semibold text-dark dark:text-white">
              {sortie.titre}
              <span className="ml-2 text-sm font-normal text-dark-5 dark:text-dark-6">— {sortie.lieu}</span>
            </p>
            <p className="mb-3 text-sm text-dark-5 dark:text-dark-6">Début : {sortie.heureDebut}</p>

            {sortie.groupeNumero !== null ? (
              <div className="rounded-lg bg-gray-1 px-3 py-2.5 dark:bg-dark-2">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-dark-5 dark:text-dark-6">
                  Votre groupe — Groupe {sortie.groupeNumero}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${sortie.statut === "en_cours" ? "bg-green/15 text-green" : "bg-blue-500/15 text-blue-600"}`}>
                    {monNom} (vous)
                  </span>
                  {sortie.coequipiers.map((nom) => (
                    <span key={nom} className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${sortie.statut === "en_cours" ? "bg-green/15 text-green" : "bg-blue-500/15 text-blue-600"}`}>
                      {nom}
                    </span>
                  ))}
                </div>
              </div>
            ) : sortie.tousGroupes.length > 0 ? (
              <div className="space-y-2">
                {sortie.tousGroupes.map((g) => (
                  <div key={g.groupe} className="rounded-lg bg-gray-1 px-3 py-2.5 dark:bg-dark-2">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-dark-5 dark:text-dark-6">
                      Groupe {g.groupe}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {g.noms.map((nom) => (
                        <span key={nom} className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${sortie.statut === "en_cours" ? "bg-green/15 text-green" : "bg-blue-500/15 text-blue-600"}`}>
                          {nom}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-dark-5 dark:text-dark-6">Aucun groupe défini pour ce programme.</p>
            )}
          </div>
        </div>
      )}

      {/* ===== TOASTS ===== */}
      {statut === "succes" && (
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-green/10 px-4 py-4 text-base font-semibold text-green">
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Rencontre enregistrée — Gloire à Dieu !
        </div>
      )}
      {statut === "erreur" && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-red/30 bg-red/10 px-4 py-4 text-sm font-semibold text-red">
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
          </svg>
          {erreurMsg}
        </div>
      )}

      {/* ===== FORMULAIRE ===== */}
      <form onSubmit={handleSubmit} className="space-y-4 pb-32">

        <Section titre="Informations de base" accent="border-l-primary">
          <Champ label="Nom / Prénom" required>
            <input type="text" placeholder="ex : Marie Dupont" value={form.nom}
              onChange={(e) => set("nom", e.target.value)} className={inputClass} autoComplete="off" />
          </Champ>

          <Champ label="Ville" required>
            <div className="relative" ref={villeRef}>
              <input type="text" placeholder="Tapez une ville française…" value={form.ville}
                onChange={(e) => handleVilleChange(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                className={`${inputClass} ${form.villeLat ? "border-green pr-10" : ""}`} autoComplete="off" />
              {form.villeLat && (
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" fill="#22AD5C" />
                  </svg>
                </div>
              )}
              {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-stroke bg-white shadow-lg dark:border-dark-3 dark:bg-gray-dark">
                  {suggestions.map((v, i) => (
                    <li key={i}>
                      <button type="button" onMouseDown={() => selectVille(v)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-gray-1 dark:hover:bg-dark-2">
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" className="shrink-0 text-primary">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="currentColor" />
                        </svg>
                        <span className="flex-1 text-sm font-medium text-dark dark:text-white">{v.nom}</span>
                        <span className="text-xs text-dark-5 dark:text-dark-6">{v.codePostal}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {form.villeLat && (
              <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-green">
                <svg width={12} height={12} viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Coordonnées GPS enregistrées
              </p>
            )}
          </Champ>

          <Champ label="Religion">
            <div className="relative">
              <select value={form.religion} onChange={(e) => set("religion", e.target.value)}
                className={`${inputClass} appearance-none pr-10`}>
                <option value="">— Sélectionner —</option>
                {RELIGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <svg className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-dark-5" width={16} height={16} viewBox="0 0 24 24" fill="none">
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </Champ>
        </Section>

        <Section titre="Prière spontanée" accent="border-l-[#8155FF]">
          <Champ label="Veut une prière ?">
            <BoutonOuiNon valeur={form.veutPriere} onChange={(v) => { set("veutPriere", v); if (v !== "oui") set("guerison", null); }} />
          </Champ>
          {form.veutPriere === "oui" && (
            <Champ label="Guérison constatée ?">
              <BoutonOuiNon valeur={form.guerison} onChange={(v) => set("guerison", v)} />
            </Champ>
          )}
        </Section>

        <Section titre="Prière du Salut" accent="border-l-[#FF9C55]">
          <Champ label="A accepté Jésus comme Seigneur ?">
            <BoutonOuiNon valeur={form.salut} onChange={(v) => {
              set("salut", v);
              if (v !== "oui") { set("besoinEglise", null); set("telephone", ""); set("reseaux", ""); }
            }} />
          </Champ>
          {form.salut === "oui" && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 rounded-xl bg-[#FF9C55]/10 px-4 py-3 text-sm font-bold text-[#FF9C55]">
                🎉 Nouvelle âme sauvée — Gloire à Dieu !
              </div>
              <Champ label="Besoin d'une église ?">
                <BoutonOuiNon valeur={form.besoinEglise} onChange={(v) => set("besoinEglise", v)} />
              </Champ>
              <Champ label="Téléphone">
                <input type="tel" placeholder="+33 6 00 00 00 00" value={form.telephone}
                  onChange={(e) => set("telephone", e.target.value)} className={inputClass} />
              </Champ>
              <Champ label="Réseaux sociaux">
                <input type="text" placeholder="@pseudo ou lien" value={form.reseaux}
                  onChange={(e) => set("reseaux", e.target.value)} className={inputClass} />
              </Champ>
            </div>
          )}
        </Section>

        <Section titre="Notes libres" accent="border-l-stroke dark:border-l-dark-3">
          <Champ label="Observations">
            <textarea rows={3} placeholder="Contexte, besoins spécifiques…" value={form.notes}
              onChange={(e) => set("notes", e.target.value)} className={`${inputClass} resize-none`} />
          </Champ>
        </Section>

      </form>

      {/* ===== BOUTON FIXE ===== */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-stroke bg-white px-4 pb-6 pt-3 dark:border-dark-3 dark:bg-gray-dark">
        <div className="mx-auto max-w-lg">
          <button type="button" onClick={() => handleSubmit()}
            disabled={isPending || !form.nom.trim() || !form.ville.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-base font-bold text-white shadow-lg transition active:scale-95 disabled:opacity-60">
            {isPending ? (
              <>
                <svg className="animate-spin" width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <circle cx={12} cy={12} r={10} stroke="currentColor" strokeWidth={3} strokeDasharray="60" strokeDashoffset="20" />
                </svg>
                Enregistrement…
              </>
            ) : (
              <>
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M17 21v-8H7v8M7 3v5h8" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Enregistrer la rencontre
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
