"use client";

import { ajouterEvangeliste, suspendreEvangeliste, reactiverEvangeliste, supprimerEvangeliste, supprimerAdmin } from "@/actions/equipe.actions";
import { genererQRToken } from "@/actions/qr-invite.actions";
import { QRCodeSVG } from "qrcode.react";
import { useState, useTransition, useEffect, useRef } from "react";

interface MembreStats {
  id: string;
  nom: string;
  email: string;
  role: string;
  actif: boolean;
  invitationEnCours: boolean;
  createdAt: Date;
  totalAmes: number;
  semaineAmes: number;
  totalSaluts: number;
  totalGuerisons: number;
  derniereRencontre: Date | null;
}

function formatDate(d: Date | null) {
  if (!d) return "Jamais";
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function Initiales({ nom, isAdmin }: { nom: string; isAdmin: boolean }) {
  const init = nom.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className={`flex size-12 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
      isAdmin ? "bg-primary/15 text-primary" : "bg-green/15 text-green"
    }`}>
      {init}
    </div>
  );
}

function BadgeRole({ role }: { role: string }) {
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
      isAdmin ? "bg-primary/15 text-primary" : "bg-green/15 text-green"
    }`}>
      {role === "SUPER_ADMIN" ? "Super Admin" : isAdmin ? "Admin" : "Évangéliste"}
    </span>
  );
}

export default function EquipeClient({
  membres,
  isAdmin,
  isSuperAdmin,
}: {
  membres: MembreStats[];
  isAdmin: boolean;
  isSuperAdmin: boolean;
}) {
  const [showModal, setShowModal] = useState(false);
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [statut, setStatut] = useState<"idle" | "succes" | "erreur">("idle");
  const [erreurMsg, setErreurMsg] = useState("");
  const [emailInvite, setEmailInvite] = useState("");
  const [isPending, startTransition] = useTransition();
  const [ongletModal, setOngletModal] = useState<"email" | "qr">("email");
  const [qrLien, setQrLien] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrSecondes, setQrSecondes] = useState(30);
  const qrExpiresAt = useRef<number>(0);
  const qrRotateRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const qrCountdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Gestion membre (suspendre / réactiver / supprimer)
  const [actionMembre, setActionMembre] = useState<{ type: "suspendre" | "reactiver" | "supprimer"; membre: MembreStats } | null>(null);
  const [actionErreur, setActionErreur] = useState("");
  const [actionPending, startActionTransition] = useTransition();

  function confirmerAction() {
    if (!actionMembre) return;
    setActionErreur("");
    startActionTransition(async () => {
      let result;
      if (actionMembre.type === "suspendre") result = await suspendreEvangeliste(actionMembre.membre.id);
      else if (actionMembre.type === "reactiver") result = await reactiverEvangeliste(actionMembre.membre.id);
      else result = await (actionMembre.membre.role === "ADMIN" ? supprimerAdmin : supprimerEvangeliste)(actionMembre.membre.id);

      if (result.success) {
        setActionMembre(null);
      } else {
        setActionErreur(result.error ?? "Erreur.");
      }
    });
  }

  const totalAmes = membres.reduce((a, m) => a + m.totalAmes, 0);
  const totalSaluts = membres.reduce((a, m) => a + m.totalSaluts, 0);
  const actifs = membres.filter((m) => m.actif).length;
  const semaineTotal = membres.reduce((a, m) => a + m.semaineAmes, 0);

  function ouvrirModal() {
    setNom(""); setEmail(""); setStatut("idle"); setErreurMsg(""); setEmailInvite("");
    setShowModal(true);
  }

  function fermerModal() { setShowModal(false); setStatut("idle"); setOngletModal("email"); stopperQR(); }

  async function chargerNouveauQR() {
    try {
      const res = await genererQRToken();
      setQrLien(res.lien);
      qrExpiresAt.current = res.expiresAt;
      setQrSecondes(30);
    } catch {
      setQrLien(null);
    }
  }

  async function ouvrirOngletQR() {
    setOngletModal("qr");
    setQrLoading(true);
    await chargerNouveauQR();
    setQrLoading(false);

    // Compte à rebours chaque seconde — rotation auto quand il atteint 0
    qrCountdownRef.current = setInterval(async () => {
      const restant = Math.max(0, Math.ceil((qrExpiresAt.current - Date.now()) / 1000));
      setQrSecondes(restant);
      if (restant <= 0) {
        await chargerNouveauQR();
      }
    }, 1_000);
  }

  function stopperQR() {
    if (qrCountdownRef.current) { clearInterval(qrCountdownRef.current); qrCountdownRef.current = null; }
    setQrLien(null);
    setQrSecondes(30);
  }

  function handleAjouter() {
    if (!nom.trim() || !email.trim()) return;
    setStatut("idle"); setErreurMsg("");
    startTransition(async () => {
      const result = await ajouterEvangeliste({ nom, email });
      if (result.success) {
        setStatut("succes");
        setEmailInvite(email);
      } else {
        setStatut("erreur");
        setErreurMsg(result.error ?? "Erreur inconnue.");
      }
    });
  }

  return (
    <>
      {/* ===== KPI CARDS ===== */}
      <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: "Membres", value: membres.length, color: "text-primary" },
          { label: "Actifs", value: actifs, color: "text-green" },
          { label: "Âmes (total)", value: totalAmes, color: "text-[#FF9C55]" },
          { label: "Saluts (total)", value: totalSaluts, color: "text-[#8155FF]" },
        ].map((s) => (
          <div key={s.label} className="rounded-[10px] bg-white p-4 shadow-1 dark:bg-gray-dark dark:shadow-card">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="mt-0.5 text-xs text-dark-5 dark:text-dark-6">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ===== EN-TÊTE ===== */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-dark dark:text-white">Membres de l&apos;équipe</h3>
          <p className="text-xs text-dark-5 dark:text-dark-6">
            {semaineTotal} âme{semaineTotal !== 1 ? "s" : ""} cette semaine
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={ouvrirModal}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-primary/90 active:scale-95"
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
            </svg>
            Inviter
          </button>
        )}
      </div>

      {membres.length === 0 ? (
        <div className="rounded-[10px] bg-white px-6 py-12 text-center shadow-1 dark:bg-gray-dark">
          <p className="text-sm text-dark-5 dark:text-dark-6">Aucun membre dans votre équipe.</p>
          {isAdmin && (
            <button onClick={ouvrirModal} className="mt-3 text-sm font-semibold text-primary hover:underline">
              Inviter le premier évangéliste →
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ——— MOBILE : liste ——— */}
          <div className="space-y-3 sm:hidden">
            {membres.map((m) => (
              <div key={m.id} className="rounded-[10px] bg-white p-4 shadow-1 dark:bg-gray-dark dark:shadow-card">
                <div className="flex items-center gap-3">
                  <Initiales nom={m.nom} isAdmin={m.role === "ADMIN"} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-bold text-dark dark:text-white">{m.nom}</p>
                      <BadgeRole role={m.role} />
                      {!m.actif && m.invitationEnCours && (
                        <span className="rounded-full bg-[#FF9C55]/10 px-2 py-0.5 text-[10px] font-bold text-[#FF9C55]">Invitation en cours</span>
                      )}
                      {!m.actif && !m.invitationEnCours && (
                        <span className="rounded-full bg-red/10 px-2 py-0.5 text-[10px] font-bold text-red">Suspendu</span>
                      )}
                    </div>
                    <p className="truncate text-xs text-dark-5 dark:text-dark-6">{m.email}</p>
                  </div>
                </div>

                {/* Stats semaine */}
                <div className="mt-3 rounded-lg bg-primary/8 px-3 py-2 dark:bg-primary/10">
                  <p className="text-sm font-bold text-primary">
                    {m.semaineAmes} âme{m.semaineAmes !== 1 ? "s" : ""} cette semaine
                  </p>
                </div>

                {/* Stats totaux */}
                <div className="mt-3 grid grid-cols-3 divide-x divide-stroke rounded-lg border border-stroke dark:divide-dark-3 dark:border-dark-3">
                  {[
                    { val: m.totalAmes, label: "Âmes", color: "text-dark dark:text-white" },
                    { val: m.totalSaluts, label: "Saluts", color: "text-green" },
                    { val: m.totalGuerisons, label: "Guérisons", color: "text-[#FF9C55]" },
                  ].map((st) => (
                    <div key={st.label} className="flex flex-col items-center py-2">
                      <p className={`text-base font-bold ${st.color}`}>{st.val}</p>
                      <p className="text-[10px] text-dark-5 dark:text-dark-6">{st.label}</p>
                    </div>
                  ))}
                </div>

                <p className="mt-2 text-right text-xs text-dark-5 dark:text-dark-6">
                  Dernière sortie : <span className="font-medium text-dark dark:text-white">{formatDate(m.derniereRencontre)}</span>
                </p>

                {/* Actions admin — évangélistes seulement */}
                {isAdmin && m.role !== "ADMIN" && m.role !== "SUPER_ADMIN" && (
                  <div className="mt-3 flex gap-2 border-t border-stroke pt-3 dark:border-dark-3">
                    {m.actif ? (
                      <button onClick={() => setActionMembre({ type: "suspendre", membre: m })}
                        className="flex-1 rounded-lg border border-stroke py-2 text-xs font-semibold text-dark-5 transition hover:border-red/50 hover:text-red dark:border-dark-3 dark:text-dark-6">
                        Suspendre
                      </button>
                    ) : (
                      <button onClick={() => setActionMembre({ type: "reactiver", membre: m })}
                        className="flex-1 rounded-lg border border-green/40 py-2 text-xs font-semibold text-green transition hover:bg-green/10">
                        Réactiver
                      </button>
                    )}
                    <button onClick={() => setActionMembre({ type: "supprimer", membre: m })}
                      className="rounded-lg border border-stroke px-3 py-2 text-xs font-semibold text-red transition hover:bg-red/10 dark:border-dark-3">
                      <svg width={13} height={13} viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                  </div>
                )}
                {/* Supprimer admin — super admin seulement */}
                {isSuperAdmin && m.role === "ADMIN" && (
                  <div className="mt-3 flex gap-2 border-t border-stroke pt-3 dark:border-dark-3">
                    <button onClick={() => setActionMembre({ type: "supprimer", membre: m })}
                      className="rounded-lg border border-stroke px-3 py-2 text-xs font-semibold text-red transition hover:bg-red/10 dark:border-dark-3">
                      <svg width={13} height={13} viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ——— DESKTOP : grille ——— */}
          <div className="hidden gap-5 sm:grid sm:grid-cols-2 xl:grid-cols-3">
            {membres.map((m) => (
              <div key={m.id} className="flex flex-col rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
                <div className="relative flex flex-col items-center px-5 pb-4 pt-7 text-center">
                  <div className="flex items-center gap-1.5">
                    <BadgeRole role={m.role} />
                    {!m.actif && m.invitationEnCours && (
                        <span className="rounded-full bg-[#FF9C55]/10 px-2 py-0.5 text-[10px] font-bold text-[#FF9C55]">Invitation en cours</span>
                      )}
                      {!m.actif && !m.invitationEnCours && (
                        <span className="rounded-full bg-red/10 px-2 py-0.5 text-[10px] font-bold text-red">Suspendu</span>
                      )}
                  </div>
                  <div className="mt-3 mb-3">
                    <Initiales nom={m.nom} isAdmin={m.role === "ADMIN"} />
                  </div>
                  <p className="font-bold text-dark dark:text-white">{m.nom}</p>
                  <p className="mt-0.5 text-xs text-dark-5 dark:text-dark-6">{m.email}</p>
                  <div className="mt-3 w-full rounded-lg bg-primary/8 px-3 py-2 dark:bg-primary/10">
                    <p className="text-sm font-bold text-primary">
                      {m.semaineAmes} âme{m.semaineAmes !== 1 ? "s" : ""} cette semaine
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 divide-x divide-stroke border-t border-stroke dark:divide-dark-3 dark:border-dark-3">
                  {[
                    { val: m.totalAmes, label: "Âmes", color: "text-dark dark:text-white" },
                    { val: m.totalSaluts, label: "Saluts", color: "text-green" },
                    { val: m.totalGuerisons, label: "Guér.", color: "text-[#FF9C55]" },
                  ].map((st) => (
                    <div key={st.label} className="flex flex-col items-center py-3">
                      <p className={`text-lg font-bold ${st.color}`}>{st.val}</p>
                      <p className="text-[11px] text-dark-5 dark:text-dark-6">{st.label}</p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-stroke px-4 py-3 dark:border-dark-3">
                  <p className="text-xs text-dark-5 dark:text-dark-6">
                    Dernière sortie : <span className="font-medium text-dark dark:text-white">{formatDate(m.derniereRencontre)}</span>
                  </p>
                </div>

                {/* Actions admin */}
                {isAdmin && m.role !== "ADMIN" && m.role !== "SUPER_ADMIN" && (
                  <div className="flex gap-2 border-t border-stroke px-4 pb-4 pt-3 dark:border-dark-3">
                    {m.actif ? (
                      <button onClick={() => setActionMembre({ type: "suspendre", membre: m })}
                        className="flex-1 rounded-lg border border-stroke py-2 text-xs font-semibold text-dark-5 transition hover:border-red/50 hover:text-red dark:border-dark-3 dark:text-dark-6">
                        Suspendre l&apos;accès
                      </button>
                    ) : (
                      <button onClick={() => setActionMembre({ type: "reactiver", membre: m })}
                        className="flex-1 rounded-lg border border-green/40 py-2 text-xs font-semibold text-green transition hover:bg-green/10">
                        Réouvrir l&apos;accès
                      </button>
                    )}
                    <button onClick={() => setActionMembre({ type: "supprimer", membre: m })}
                      title="Supprimer"
                      className="rounded-lg border border-stroke px-3 py-2 text-red transition hover:bg-red/10 dark:border-dark-3">
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                  </div>
                )}
                {/* Supprimer admin — super admin seulement */}
                {isSuperAdmin && m.role === "ADMIN" && (
                  <div className="flex gap-2 border-t border-stroke px-4 pb-4 pt-3 dark:border-dark-3">
                    <button onClick={() => setActionMembre({ type: "supprimer", membre: m })}
                      title="Supprimer l'admin"
                      className="rounded-lg border border-stroke px-3 py-2 text-red transition hover:bg-red/10 dark:border-dark-3">
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ===== MODALE CONFIRMATION ACTION MEMBRE ===== */}
      {actionMembre && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActionMembre(null)} />
          <div className="relative z-10 w-full rounded-t-2xl bg-white dark:bg-gray-dark sm:max-w-sm sm:rounded-2xl">
            <div className="flex justify-center pt-3 sm:hidden">
              <div className="h-1 w-10 rounded-full bg-stroke dark:bg-dark-3" />
            </div>

            <div className="p-5">
              {/* Icône */}
              <div className={`mx-auto mb-4 flex size-14 items-center justify-center rounded-full ${
                actionMembre.type === "supprimer" ? "bg-red/10" :
                actionMembre.type === "suspendre" ? "bg-[#FF9C55]/10" : "bg-green/10"
              }`}>
                {actionMembre.type === "supprimer" && (
                  <svg width={22} height={22} viewBox="0 0 24 24" fill="none" className="text-red"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
                )}
                {actionMembre.type === "suspendre" && (
                  <svg width={22} height={22} viewBox="0 0 24 24" fill="none" className="text-[#FF9C55]"><path d="M10 9v6m4-6v6M12 22a10 10 0 100-20 10 10 0 000 20z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" /></svg>
                )}
                {actionMembre.type === "reactiver" && (
                  <svg width={22} height={22} viewBox="0 0 24 24" fill="none" className="text-green"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" /></svg>
                )}
              </div>

              <h3 className="mb-1 text-center font-bold text-dark dark:text-white">
                {actionMembre.type === "supprimer" && "Supprimer ce membre ?"}
                {actionMembre.type === "suspendre" && "Suspendre l'accès ?"}
                {actionMembre.type === "reactiver" && "Réouvrir l'accès ?"}
              </h3>
              <p className="mb-1 text-center text-sm font-semibold text-dark dark:text-white">{actionMembre.membre.nom}</p>
              <p className="mb-4 text-center text-xs text-dark-5 dark:text-dark-6">
                {actionMembre.type === "supprimer" && "Cette action est irréversible. Toutes ses données seront supprimées."}
                {actionMembre.type === "suspendre" && "Il ne pourra plus se connecter jusqu'à réactivation."}
                {actionMembre.type === "reactiver" && "Il pourra à nouveau se connecter et utiliser l'application."}
              </p>

              {actionErreur && (
                <p className="mb-3 rounded-lg bg-red/10 px-3 py-2 text-center text-xs font-semibold text-red">{actionErreur}</p>
              )}

              <div className="flex gap-3">
                <button onClick={() => { setActionMembre(null); setActionErreur(""); }}
                  className="flex-1 rounded-xl border border-stroke py-3 text-sm font-semibold text-dark dark:border-dark-3 dark:text-white">
                  Annuler
                </button>
                <button onClick={confirmerAction} disabled={actionPending}
                  className={`flex-1 rounded-xl py-3 text-sm font-bold text-white transition disabled:opacity-50 ${
                    actionMembre.type === "supprimer" ? "bg-red hover:bg-red/90" :
                    actionMembre.type === "suspendre" ? "bg-[#FF9C55] hover:bg-[#FF9C55]/90" : "bg-green hover:bg-green/90"
                  }`}>
                  {actionPending ? "En cours…" :
                    actionMembre.type === "supprimer" ? "Supprimer" :
                    actionMembre.type === "suspendre" ? "Suspendre" : "Réactiver"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODALE INVITATION ===== */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={fermerModal} />
          <div className="relative z-10 w-full rounded-t-2xl bg-white dark:bg-gray-dark sm:max-w-md sm:rounded-2xl">

            <div className="flex justify-center pt-3 sm:hidden">
              <div className="h-1 w-10 rounded-full bg-stroke dark:bg-dark-3" />
            </div>

            <div className="flex items-center justify-between border-b border-stroke px-5 py-4 dark:border-dark-3">
              <div>
                <h3 className="font-bold text-dark dark:text-white">Ajouter un évangéliste</h3>
                <p className="text-xs text-dark-5 dark:text-dark-6">Invitation par email ou QR code</p>
              </div>
              <button onClick={fermerModal} className="flex size-8 items-center justify-center rounded-full transition hover:bg-gray-1 dark:hover:bg-dark-2">
                <svg width={15} height={15} viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Onglets */}
            {statut !== "succes" && (
              <div className="grid grid-cols-2 gap-1 border-b border-stroke bg-gray-1/40 px-5 py-3 dark:border-dark-3 dark:bg-dark-2/20">
                <button
                  onClick={() => setOngletModal("email")}
                  className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${ongletModal === "email" ? "bg-primary text-white" : "text-dark-5 dark:text-dark-6"}`}
                >
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="currentColor" strokeWidth={2} strokeLinecap="round"/></svg>
                  Par email
                </button>
                <button
                  onClick={ouvrirOngletQR}
                  className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${ongletModal === "qr" ? "bg-primary text-white" : "text-dark-5 dark:text-dark-6"}`}
                >
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth={2}/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth={2}/><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth={2}/><path d="M14 14h2v2h-2zM18 14h3v2h-3zM14 18h2v3h-2zM18 18h3v3h-3z" fill="currentColor"/></svg>
                  QR Code
                </button>
              </div>
            )}

            {statut === "succes" ? (
              <div className="flex flex-col items-center px-5 py-10">
                <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-green/10">
                  <svg width={30} height={30} viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="#22AD5C" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="font-bold text-dark dark:text-white">Compte créé !</p>
                <p className="mt-1 text-center text-sm text-dark-5 dark:text-dark-6">
                  L&apos;invitation a été envoyée par email à
                </p>
                <p className="mt-1 font-semibold text-primary">{emailInvite}</p>

                {/* Info email */}
                <div className="mt-5 w-full rounded-xl border border-primary/20 bg-primary/5 px-5 py-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                        <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="#5750F1" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <p className="text-sm text-dark-5 dark:text-dark-6">
                      L&apos;évangéliste recevra ses identifiants de connexion par email et devra changer son mot de passe à la première connexion.
                    </p>
                  </div>
                </div>

                <button
                  onClick={fermerModal}
                  className="mt-5 w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-white transition hover:bg-primary/90"
                >
                  Fermer
                </button>
              </div>
            ) : ongletModal === "email" ? (
              <div className="space-y-4 p-5">
                {statut === "erreur" && (
                  <div className="flex items-center gap-2.5 rounded-xl border border-red/30 bg-red/10 px-4 py-3">
                    <p className="text-sm font-medium text-red">{erreurMsg}</p>
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-dark dark:text-white">Nom complet *</label>
                  <input
                    type="text"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    placeholder="Prénom Nom"
                    className="w-full rounded-xl border border-stroke bg-gray-1 px-4 py-3.5 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-dark dark:text-white">Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="prenom.nom@email.fr"
                    className="w-full rounded-xl border border-stroke bg-gray-1 px-4 py-3.5 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  />
                </div>

                <div className="flex gap-3 pb-2 pt-1">
                  <button onClick={fermerModal} className="flex-1 rounded-xl border border-stroke py-3.5 text-sm font-semibold text-dark dark:border-dark-3 dark:text-white">
                    Annuler
                  </button>
                  <button
                    onClick={handleAjouter}
                    disabled={!nom.trim() || !email.trim() || isPending}
                    className="flex-1 rounded-xl bg-primary py-3.5 text-sm font-bold text-white transition hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isPending ? "Création…" : "Créer le compte"}
                  </button>
                </div>
              </div>
            ) : (
              /* ── Panneau QR Code dynamique ── */
              <div className="flex flex-col items-center p-5 pb-6">
                {qrLoading ? (
                  <div className="flex h-56 items-center justify-center">
                    <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                ) : qrLien ? (
                  <>
                    <p className="mb-4 text-center text-sm text-dark-5 dark:text-dark-6">
                      Faites scanner ce QR code. Il se renouvelle automatiquement.
                    </p>

                    {/* QR Code */}
                    <div className="rounded-2xl bg-white p-4 shadow-md">
                      <QRCodeSVG value={qrLien} size={200} />
                    </div>

                    {/* Barre de progression + compteur */}
                    <div className="mt-4 w-full space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-dark-5 dark:text-dark-6">Renouvellement automatique</span>
                        <span className={`font-bold ${qrSecondes <= 5 ? "text-red" : "text-primary"}`}>{qrSecondes}s</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-stroke dark:bg-dark-3">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${qrSecondes <= 5 ? "bg-red" : "bg-primary"}`}
                          style={{ width: `${(qrSecondes / 30) * 100}%` }}
                        />
                      </div>
                    </div>

                    <button onClick={fermerModal} className="mt-5 w-full rounded-xl bg-primary py-3 text-sm font-bold text-white transition hover:bg-primary/90">
                      Fermer
                    </button>
                  </>
                ) : (
                  <p className="text-sm text-dark-5 dark:text-dark-6">Erreur lors de la génération du QR code.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
