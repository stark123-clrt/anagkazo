import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";

export const dynamic = "force-dynamic";

export default async function EvangelisteDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");

  const userId = session.user.id;
  const orgId = session.user.organizationId;
  const monNom = session.user.name ?? session.user.email ?? "Évangéliste";

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  // Début du mois courant
  const debutMois = new Date();
  debutMois.setDate(1);
  debutMois.setHours(0, 0, 0, 0);

  // Début des 30 derniers jours (minuit heure locale FR = UTC-2h offset)
  const debut30j = new Date();
  debut30j.setDate(debut30j.getDate() - 29);
  debut30j.setHours(0, 0, 0, 0);

  const whereAll  = { organizationId: orgId, evangelisteId: userId };
  const whereMois = { ...whereAll, createdAt: { gte: debutMois } };

  const [
    totalAmes, totalSaluts, totalPrieres, totalGuerisons,
    moisAmes,  moisSaluts,  moisPrieres,  moisGuerisons,
    dernieres,
    activite30j,
  ] = await Promise.all([
    prisma.rencontre.count({ where: whereAll }),
    prisma.rencontre.count({ where: { ...whereAll, priereSalut: true } }),
    prisma.rencontre.count({ where: { ...whereAll, priereSpontanee: true } }),
    prisma.rencontre.count({ where: { ...whereAll, guerison: true } }),

    prisma.rencontre.count({ where: whereMois }),
    prisma.rencontre.count({ where: { ...whereMois, priereSalut: true } }),
    prisma.rencontre.count({ where: { ...whereMois, priereSpontanee: true } }),
    prisma.rencontre.count({ where: { ...whereMois, guerison: true } }),

    prisma.rencontre.findMany({
      where: whereAll,
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        personneNom: true,
        personneVille: true,
        priereSalut: true,
        guerison: true,
        priereSpontanee: true,
        createdAt: true,
      },
    }),

    // Rencontres des 30 derniers jours pour graphique d'activité (toute l'organisation)
    prisma.rencontre.findMany({
      where: { organizationId: orgId, createdAt: { gte: debut30j } },
      select: { createdAt: true, evangelisteId: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Construire tableau de 30 jours (jour → nb rencontres) en heure locale Paris
  const toLocalDate = (d: Date) =>
    d.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" })
     .split("/").reverse().join("-"); // → YYYY-MM-DD

  const joursMap: Record<string, number> = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date(debut30j);
    d.setDate(d.getDate() + i);
    joursMap[toLocalDate(d)] = 0;
  }
  for (const r of activite30j) {
    const key = toLocalDate(new Date(r.createdAt));
    if (key in joursMap) joursMap[key]++;
  }
  const joursData = Object.values(joursMap); // [nb, nb, ...]
  const maxJour = Math.max(...joursData, 1);
  // Rencontres de l'évangéliste connecté ce mois (pour le compteur du graphique)
  const mesRencontres30j = activite30j.filter((r) => r.evangelisteId === userId).length;

  const STATS = [
    { label: "Âmes abordées",      total: totalAmes,      mois: moisAmes,      couleur: "text-primary",   bg: "bg-primary/10"   },
    { label: "Prières du Salut",   total: totalSaluts,    mois: moisSaluts,    couleur: "text-green-500", bg: "bg-green-500/10" },
    { label: "Prières spontanées", total: totalPrieres,   mois: moisPrieres,   couleur: "text-[#8155FF]", bg: "bg-[#8155FF]/10" },
    { label: "Guérisons",          total: totalGuerisons, mois: moisGuerisons, couleur: "text-[#FF9C55]", bg: "bg-[#FF9C55]/10" },
  ];

  const nomMois = new Date().toLocaleDateString("fr-FR", { month: "long" });

  return (
    <>
      <Breadcrumb pageName="Tableau de bord" />

      {/* Bienvenue */}
      <div className="mb-5 rounded-[10px] bg-white p-5 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <p className="text-xs capitalize text-dark-5 dark:text-dark-6">Aujourd&apos;hui · {today}</p>
        <h2 className="mt-0.5 text-lg font-bold text-dark dark:text-white">Bonjour {monNom},</h2>
        <p className="mt-1 text-sm text-dark-5 dark:text-dark-6">Voici ton impact pour le Royaume.</p>
      </div>

      {/* Stats 2x2 */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {STATS.map((s) => (
          <div key={s.label} className="rounded-[10px] bg-white p-4 shadow-1 dark:bg-gray-dark dark:shadow-card">
            <p className={`text-2xl font-bold ${s.couleur}`}>{s.total}</p>
            <p className="mt-0.5 text-xs text-dark-5 dark:text-dark-6">{s.label}</p>
            <div className="mt-2 flex items-center gap-1">
              <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${s.bg} ${s.couleur}`}>
                +{s.mois} en {nomMois}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <Link
        href="/evangeliste/terrain"
        className="mb-5 flex w-full items-center justify-center gap-2 rounded-[10px] bg-primary py-4 text-sm font-bold text-white shadow-md transition hover:bg-primary/90"
      >
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
        </svg>
        Nouvelle rencontre
      </Link>

      {/* Activité 30 jours */}
      <div className="mb-5 rounded-[10px] bg-white p-5 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-dark dark:text-white">Activité — 30 derniers jours</h3>
            <p className="text-xs text-dark-5 dark:text-dark-6">Rencontres de toute l&apos;organisation</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-primary">{activite30j.length}</p>
            <p className="text-[10px] text-dark-5 dark:text-dark-6">total · {mesRencontres30j} par moi</p>
          </div>
        </div>
        <div className="flex h-14 items-end gap-[3px]">
          {joursData.map((val, i) => (
            <div
              key={i}
              title={`${val} rencontre${val !== 1 ? "s" : ""}`}
              style={{ height: `${Math.round((val / maxJour) * 100)}%` }}
              className={`flex-1 rounded-sm transition-all ${val > 0 ? "bg-primary" : "bg-primary/10 dark:bg-primary/5"}`}
            />
          ))}
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] text-dark-5 dark:text-dark-6">
          <span>{new Date(debut30j).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
          <span>Aujourd&apos;hui</span>
        </div>
      </div>

      {/* Dernières rencontres */}
      <div className="rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
        <div className="border-b border-stroke px-5 py-4 dark:border-dark-3">
          <h3 className="text-sm font-bold uppercase tracking-wide text-dark-5 dark:text-dark-6">Dernières rencontres</h3>
        </div>

        {dernieres.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-dark-5 dark:text-dark-6">Aucune rencontre enregistrée pour le moment.</p>
            <Link href="/evangeliste/terrain" className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">
              Enregistrer ta première rencontre →
            </Link>
          </div>
        ) : (
          <>
            <div className="divide-y divide-stroke dark:divide-dark-3">
              {dernieres.map((r) => {
                const initiales = r.personneNom.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
                const label = r.priereSalut ? "Salut" : r.guerison ? "Guérison" : r.priereSpontanee ? "Prière" : "Contact";

                return (
                  <div key={r.id} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {initiales}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-dark dark:text-white">{r.personneNom}</p>
                        <p className="text-xs text-dark-5 dark:text-dark-6">
                          {r.personneVille} · {new Date(r.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                    </div>
                    <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${
                      r.priereSalut
                        ? "bg-green-500/10 text-green-500"
                        : r.guerison
                        ? "bg-[#FF9C55]/10 text-[#FF9C55]"
                        : r.priereSpontanee
                        ? "bg-[#8155FF]/10 text-[#8155FF]"
                        : "bg-primary/10 text-primary"
                    }`}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-stroke px-5 py-3 dark:border-dark-3">
              <Link href="/evangeliste/ames" className="text-xs font-semibold text-primary hover:underline">
                Voir l&apos;annuaire des âmes →
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}
