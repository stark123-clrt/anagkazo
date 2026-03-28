"use client";

import { sauvegarderRencontre } from "@/actions/rencontre.actions";
import { useEffect, useRef, useState, useTransition } from "react";

interface ProgrammeEnCours {
  id: string;
  titre: string;
  lieu: string;
  heureDebut: string;
  statut: string;
  groupeNumero: number | null;
  coequipiers: string[];
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

const inputClass =
  "w-full rounded-xl border-2 border-stroke bg-transparent px-4 py-4 text-base text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:text-white dark:focus:border-primary";

export default function TerrainForm({ programmeEnCours, monNom }: { programmeEnCours: ProgrammeEnCours | null; monNom: string }) {
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
        personneNom: form.nom,
        personneVille: form.ville,
        latitude: form.villeLat,
        longitude: form.villeLon,
        religion: form.religion,
        priereSpontanee: form.veutPriere === "oui",
        guerison: form.guerison === "oui",
        priereSalut: form.salut === "oui",
        besoinEglise: form.besoinEglise === "oui",
        contact: [form.telephone, form.reseaux].filter(Boolean).join(" · ") || null,
        // Lier au programme seulement si la sortie est en cours
        programmeId: programmeEnCours?.statut === "en_cours" ? programmeEnCours.id : null,
        groupeEquipe: programmeEnCours?.statut === "en_cours" && programmeEnCours.groupeNumero != null
          ? [monNom, ...programmeEnCours.coequipiers]
          : [],
      });

      if (result.success) {
        setStatut("succes");
        setForm(FORM_VIDE);
        setSuggestions([]);
        setTimeout(() => setStatut("idle"), 5000);
      } else {
        setStatut("erreur");
        setErreurMsg(result.error ?? "Erreur inconnue.");
      }
    });
  }

  return (
    <>
      {/* ===== BANNIÈRE PROGRAMME EN COURS ===== */}
      {programmeEnCours && (
        <div className={`mb-4 overflow-hidden rounded-[10px] border ${programmeEnCours.statut === "en_cours" ? "border-green/30 bg-green/5 dark:bg-green/10" : "border-primary/30 bg-primary/5 dark:bg-primary/10"}`}>
          {/* En-tête bannière */}
          <div className={`flex items-center gap-2 px-4 py-2.5 ${programmeEnCours.statut === "en_cours" ? "bg-green/10 dark:bg-green/20" : "bg-primary/10 dark:bg-primary/20"}`}>
            {programmeEnCours.statut === "en_cours" ? (
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-green" />
              </span>
            ) : (
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" className="text-primary">
                <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"/>
              </svg>
            )}
            <p className={`text-xs font-bold uppercase tracking-wide ${programmeEnCours.statut === "en_cours" ? "text-green" : "text-primary"}`}>
              {programmeEnCours.statut === "en_cours" ? "Sortie en cours" : "Programme du jour"}
            </p>
            <span className={`ml-auto text-xs font-semibold ${programmeEnCours.statut === "en_cours" ? "text-green" : "text-primary"}`}>
              {programmeEnCours.heureDebut}
            </span>
          </div>
          {/* Détails */}
          <div className="px-4 py-3">
            <p className="font-semibold text-dark dark:text-white">{programmeEnCours.titre}</p>
            <p className="mt-0.5 text-xs text-dark-5 dark:text-dark-6">{programmeEnCours.lieu}</p>

            {programmeEnCours.groupeNumero !== null && (
              <div className="mt-2.5 flex items-center gap-2">
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                  Groupe {programmeEnCours.groupeNumero}
                </span>
                {programmeEnCours.coequipiers.length > 0 ? (
                  <span className="text-xs text-dark-5 dark:text-dark-6">
                    avec{" "}
                    <span className="font-semibold text-dark dark:text-white">
                      {programmeEnCours.coequipiers.join(", ")}
                    </span>
                  </span>
                ) : (
                  <span className="text-xs text-dark-5 dark:text-dark-6">Vous êtes seul dans ce groupe</span>
                )}
              </div>
            )}

            <p className="mt-2 text-[11px] text-dark-5 dark:text-dark-6">
              Les âmes enregistrées seront automatiquement liées à cette sortie.
            </p>
          </div>
        </div>
      )}

      {/* ===== TOAST SUCCÈS ===== */}
      {statut === "succes" && (
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-green/10 px-4 py-4 text-base font-semibold text-green">
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Rencontre enregistrée — Gloire à Dieu !
        </div>
      )}

      {statut === "erreur" && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-red/30 bg-red/10 px-4 py-4 text-sm font-semibold text-red">
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth={2} strokeLinecap="round"/>
          </svg>
          {erreurMsg}
        </div>
      )}

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
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" fill="#22AD5C"/>
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
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="currentColor"/>
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
                <svg width={12} height={12} viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
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
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
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
            <BoutonOuiNon valeur={form.salut} onChange={(v) => set("salut", v)} />
          </Champ>
          {form.salut === "oui" && (
            <div className="flex items-center gap-2 rounded-xl bg-[#FF9C55]/10 px-4 py-3 text-sm font-bold text-[#FF9C55]">
              Nouvelle âme sauvée — Gloire à Dieu !
            </div>
          )}
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
        </Section>

        <Section titre="Notes libres" accent="border-l-stroke dark:border-l-dark-3">
          <Champ label="Observations">
            <textarea rows={3} placeholder="Contexte, besoins spécifiques…" value={form.notes}
              onChange={(e) => set("notes", e.target.value)} className={`${inputClass} resize-none`} />
          </Champ>
        </Section>
      </form>

      {/* ===== BOUTON FIXE EN BAS ===== */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-stroke bg-white px-4 pb-6 pt-3 dark:border-dark-3 dark:bg-gray-dark">
        <div className="mx-auto max-w-lg">
          <button type="button" onClick={() => handleSubmit()}
            disabled={isPending || !form.nom.trim() || !form.ville.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-base font-bold text-white shadow-lg transition active:scale-95 disabled:opacity-60">
            {isPending ? (
              <><svg className="animate-spin" width={20} height={20} viewBox="0 0 24 24" fill="none"><circle cx={12} cy={12} r={10} stroke="currentColor" strokeWidth={3} strokeDasharray="60" strokeDashoffset="20"/></svg>Enregistrement…</>
            ) : (
              <><svg width={20} height={20} viewBox="0 0 24 24" fill="none"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/><path d="M17 21v-8H7v8M7 3v5h8" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>Enregistrer la rencontre</>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
