"use client";

import logoBlanc from "@/assets/logos/logo_blanc.png";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { registerAdmin, verifierOrgExistante } from "@/actions/auth.actions";
import { validerCodeAdmin, consommerCodeAdmin } from "@/actions/invitation-admin.actions";

interface VilleSuggestion {
  nom: string;
  code: string;
  codesPostaux: string[];
  centre: { coordinates: [number, number] };
}

const inputClass =
  "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3.5 text-sm text-white placeholder-white/30 outline-none transition focus:border-primary focus:bg-white/8";

const ETAPES = ["Identité", "Groupe", "Accès"];

export default function InscriptionPage() {
  const router = useRouter();

  const [etape, setEtape] = useState(0);
  const [form, setForm] = useState({
    nom: "",
    groupe: "",
    email: "",
    motdepasse: "",
    codeAdmin: "",
  });
  const [ville, setVille] = useState("");
  const [villeData, setVilleData] = useState<VilleSuggestion | null>(null);
  const [suggestions, setSuggestions] = useState<VilleSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState("");
  const [success, setSuccess] = useState(false);
  const [orgExistante, setOrgExistante] = useState<{ nom: string; nbAdmins: number } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Autocomplétion ville
  const fetchVilles = useCallback(async (q: string) => {
    if (q.length < 2) { setSuggestions([]); return; }
    try {
      const res = await fetch(
        `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(q)}&fields=nom,code,codesPostaux,centre&boost=population&limit=6`
      );
      const data: VilleSuggestion[] = await res.json();
      setSuggestions(data);
      setShowSuggestions(true);
    } catch { setSuggestions([]); }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchVilles(ville), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [ville, fetchVilles]);

  function selectVille(v: VilleSuggestion) {
    setVille(v.nom);
    setVilleData(v);
    setSuggestions([]);
    setShowSuggestions(false);
    setOrgExistante(null);
    if (!form.groupe || form.groupe.startsWith("Église ")) {
      setForm((prev) => ({ ...prev, groupe: `Église ${v.nom}` }));
    }
    verifierOrgExistante(v.nom).then((res) => {
      if (res.existe) setOrgExistante({ nom: res.nom!, nbAdmins: res.nbAdmins! });
    });
  }

  function suivant() {
    if (etape < ETAPES.length - 1) setEtape(etape + 1);
  }

  function precedent() {
    if (etape > 0) setEtape(etape - 1);
    setErreur("");
  }

  async function handleSubmit() {
    if (!villeData) return;
    setLoading(true);
    setErreur("");

    // Code admin obligatoire
    if (!form.codeAdmin.trim()) {
      setErreur("Un code d'invitation est requis pour créer un espace admin.");
      setLoading(false);
      return;
    }

    const validation = await validerCodeAdmin(form.codeAdmin.trim().toUpperCase());
    if (!validation.valide) {
      setErreur(validation.error ?? "Code invalide.");
      setLoading(false);
      return;
    }

    const result = await registerAdmin({
      nom: form.nom,
      email: form.email,
      motdepasse: form.motdepasse,
      nomGroupe: form.groupe,
      ville: villeData.nom,
      latitude: villeData.centre.coordinates[1],
      longitude: villeData.centre.coordinates[0],
      codeAdmin: form.codeAdmin.trim().toUpperCase(),
    });

    setLoading(false);

    if (!result.success) {
      setErreur(result.error ?? "Une erreur est survenue.");
      return;
    }

    await consommerCodeAdmin(form.codeAdmin.trim().toUpperCase());

    setSuccess(true);
    // Redirection vers connexion après 2s
    setTimeout(() => router.push("/connexion"), 2000);
  }

  const force = form.motdepasse.length;
  const forceLabel = force === 0 ? "" : force < 6 ? "Faible" : force < 10 ? "Moyen" : "Fort";
  const forceCouleur = force < 6 ? "bg-red-500" : force < 10 ? "bg-[#FF9C55]" : "bg-green";
  const forceWidth = force === 0 ? "w-0" : force < 6 ? "w-1/3" : force < 10 ? "w-2/3" : "w-full";
  const forceTxtCouleur = force < 6 ? "text-red-400" : force < 10 ? "text-[#FF9C55]" : "text-green";

  const etapeValide = [
    form.nom.trim().length >= 2,
    !!villeData && form.groupe.trim().length >= 2,
    form.email.includes("@") && form.motdepasse.length >= 6 && form.codeAdmin.trim().length >= 4,
  ];

  // ===== ÉCRAN SUCCÈS =====
  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#020D1A] px-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
            <svg width={36} height={36} viewBox="0 0 24 24" fill="none">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#3C50E0" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="mb-2 text-2xl font-extrabold text-white">Espace créé !</h2>
          <p className="mb-2 text-sm text-white/50">
            Bienvenue, <span className="font-semibold text-white">{form.nom}</span>.
          </p>
          <p className="mb-8 text-sm text-white/40">
            Votre espace <span className="font-semibold text-primary">{form.groupe}</span> est prêt.
          </p>
          <p className="text-xs text-white/30">Redirection vers la connexion…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#020D1A]">

      {/* Header */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#020D1A]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/accueil">
            <Image src={logoBlanc} height={44} alt="Anagkazo" style={{ objectFit: "contain" }} priority />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/connexion" className="rounded-lg px-4 py-2 text-sm font-semibold text-white/70 transition hover:text-white">
              Se connecter
            </Link>
            <Link href="/inscription" className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-primary/90">
              Commencer
            </Link>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">

        {/* Barre de progression */}
        <div className="mb-8">
          <div className="mb-3 flex justify-between">
            {ETAPES.map((label, i) => (
              <div key={label} className="flex flex-col items-center gap-1.5">
                <div className={`flex size-8 items-center justify-center rounded-full border text-xs font-bold transition ${
                  i < etape ? "border-primary bg-primary text-white" :
                  i === etape ? "border-primary bg-primary/10 text-primary" :
                  "border-white/15 text-white/30"
                }`}>
                  {i < etape ? (
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : i + 1}
                </div>
                <span className={`text-[11px] font-medium ${i === etape ? "text-primary" : "text-white/30"}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
          <div className="relative mt-1 h-0.5 w-full rounded-full bg-white/10">
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${(etape / (ETAPES.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Carte */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8">

          {/* Message d'erreur */}
          {erreur && (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-red/30 bg-red/10 px-4 py-3">
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none" className="shrink-0 text-red">
                <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
              </svg>
              <p className="text-sm font-medium text-red">{erreur}</p>
            </div>
          )}

          {/* ===== ÉTAPE 0 : Identité ===== */}
          {etape === 0 && (
            <div>
              <h1 className="mb-1 text-xl font-extrabold text-white">Quel est votre nom ?</h1>
              <p className="mb-7 text-sm text-white/40">Vous êtes l'administrateur principal de votre groupe.</p>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/40">
                  Nom et prénom
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder="ex : Jean-Paul Mbarga"
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && etapeValide[0] && suivant()}
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {/* ===== ÉTAPE 1 : Cellule ===== */}
          {etape === 1 && (
            <div>
              <h1 className="mb-1 text-xl font-extrabold text-white">
                Vous êtes responsable de quel groupe ?
              </h1>
              <p className="mb-7 text-sm text-white/40">
                Recherchez votre ville — le nom de votre groupe se complétera automatiquement.
              </p>

              <div className="relative mb-4">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/40">
                  Ville / Localité
                </label>
                <div className="relative">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Rechercher une ville..."
                    value={ville}
                    onChange={(e) => { setVille(e.target.value); setVilleData(null); }}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    className={`${inputClass} pr-10`}
                    autoComplete="off"
                  />
                  <svg className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25" width={15} height={15} viewBox="0 0 24 24" fill="none">
                    <circle cx={11} cy={11} r={8} stroke="currentColor" strokeWidth={2} />
                    <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
                  </svg>
                </div>

                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-white/15 bg-[#0D1F30] shadow-2xl">
                    {suggestions.map((v) => (
                      <button
                        key={v.code}
                        type="button"
                        onClick={() => selectVille(v)}
                        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm transition hover:bg-white/10"
                      >
                        <span className="font-semibold text-white">{v.nom}</span>
                        <span className="text-white/35">{v.codesPostaux?.[0]}</span>
                      </button>
                    ))}
                  </div>
                )}

                {villeData && (
                  <div className="mt-2 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-xs text-primary">
                    <svg width={12} height={12} viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2.25C8.27 2.25 5.25 5.27 5.25 9c0 5.25 6.75 12.75 6.75 12.75S18.75 14.25 18.75 9c0-3.73-3.02-6.75-6.75-6.75zm0 9a2.25 2.25 0 110-4.5 2.25 2.25 0 010 4.5z" />
                    </svg>
                    <span className="font-semibold">{villeData.nom}</span>
                    {villeData.centre && (
                      <span className="text-primary/50">
                        · {villeData.centre.coordinates[1].toFixed(3)}°N
                      </span>
                    )}
                  </div>
                )}
                {orgExistante && (
                  <div className="mt-2 rounded-lg border border-[#FF9C55]/30 bg-[#FF9C55]/10 px-3 py-2.5 text-xs text-[#FF9C55]">
                    <p className="font-bold">Un espace existe déjà pour cette ville</p>
                    <p className="mt-0.5 text-[#FF9C55]/80">
                      {orgExistante.nom} · {orgExistante.nbAdmins}/3 admin{orgExistante.nbAdmins > 1 ? "s" : ""} — vous allez le rejoindre comme co-admin.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/40">
                  Nom du groupe
                </label>
                <input
                  type="text"
                  placeholder="ex : Église Paris Centre"
                  value={form.groupe}
                  onChange={(e) => setForm({ ...form, groupe: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && etapeValide[1] && suivant()}
                  className={inputClass}
                />
                {villeData && (
                  <p className="mt-1.5 text-xs text-white/30">
                    Nom suggéré automatiquement — vous pouvez le modifier.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ===== ÉTAPE 2 : Accès ===== */}
          {etape === 2 && (
            <div>
              <h1 className="mb-1 text-xl font-extrabold text-white">Vos identifiants de connexion</h1>
              <p className="mb-7 text-sm text-white/40">Ces informations vous permettront de vous connecter.</p>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/40">
                    Adresse email
                  </label>
                  <input
                    type="email"
                    autoFocus
                    placeholder="vous@exemple.fr"
                    value={form.email}
                    onChange={(e) => { setForm({ ...form, email: e.target.value }); setErreur(""); }}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/40">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      placeholder="••••••••"
                      value={form.motdepasse}
                      onChange={(e) => setForm({ ...form, motdepasse: e.target.value })}
                      className={`${inputClass} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
                    >
                      {showPw
                        ? <svg width={16} height={16} viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" stroke="currentColor" strokeWidth={2} strokeLinecap="round" /></svg>
                        : <svg width={16} height={16} viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" /><circle cx={12} cy={12} r={3} stroke="currentColor" strokeWidth={2} /></svg>
                      }
                    </button>
                  </div>
                  {form.motdepasse && (
                    <div className="mt-2">
                      <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                        <div className={`h-full rounded-full transition-all duration-300 ${forceCouleur} ${forceWidth}`} />
                      </div>
                      <p className={`mt-1 text-xs font-medium ${forceTxtCouleur}`}>{forceLabel}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/40">
                    Code d&apos;invitation <span className="text-red">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="ex : A3F9C2"
                    value={form.codeAdmin}
                    onChange={(e) => { setForm({ ...form, codeAdmin: e.target.value }); setErreur(""); }}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ===== NAVIGATION ===== */}
          <div className={`mt-8 flex gap-3 ${etape > 0 ? "justify-between" : "justify-end"}`}>
            {etape > 0 && (
              <button
                type="button"
                onClick={precedent}
                className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white/60 transition hover:border-white/30 hover:text-white"
              >
                Retour
              </button>
            )}

            {etape < ETAPES.length - 1 ? (
              <button
                type="button"
                onClick={suivant}
                disabled={!etapeValide[etape]}
                className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-white transition hover:bg-primary/90 disabled:opacity-40"
              >
                Continuer
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!etapeValide[2] || loading}
                className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-white transition hover:bg-primary/90 disabled:opacity-40"
              >
                {loading ? "Création en cours…" : "Créer mon espace"}
              </button>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-white/35">
          Déjà un compte ?{" "}
          <Link href="/connexion" className="font-semibold text-primary hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
      </div>
    </div>
  );
}
