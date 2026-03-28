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

  // Stats personnelles + dernières rencontres
  const [totalAmes, totalSaluts, totalPrieres, totalGuerisons, dernieres] = await Promise.all([
    prisma.rencontre.count({ where: { organizationId: orgId, evangelisteId: userId } }),
    prisma.rencontre.count({ where: { organizationId: orgId, evangelisteId: userId, priereSalut: true } }),
    prisma.rencontre.count({ where: { organizationId: orgId, evangelisteId: userId, priereSpontanee: true } }),
    prisma.rencontre.count({ where: { organizationId: orgId, evangelisteId: userId, guerison: true } }),
    prisma.rencontre.findMany({
      where: { organizationId: orgId, evangelisteId: userId },
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
  ]);

  const STATS = [
    { label: "Âmes abordées",      val: totalAmes,     couleur: "text-primary",   bg: "bg-primary/10"   },
    { label: "Prières du Salut",   val: totalSaluts,   couleur: "text-green",     bg: "bg-green/10"     },
    { label: "Prières spontanées", val: totalPrieres,  couleur: "text-[#8155FF]", bg: "bg-[#8155FF]/10" },
    { label: "Guérisons",          val: totalGuerisons,couleur: "text-[#FF9C55]", bg: "bg-[#FF9C55]/10" },
  ];

  return (
    <>
      <Breadcrumb pageName="Tableau de bord" />

      {/* Message de bienvenue */}
      <div className="mb-5 rounded-[10px] bg-white p-5 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <p className="text-xs capitalize text-dark-5 dark:text-dark-6">Aujourd&apos;hui · {today}</p>
        <h2 className="mt-0.5 text-lg font-bold text-dark dark:text-white">Bonjour {monNom},</h2>
        <p className="mt-1 text-sm text-dark-5 dark:text-dark-6">Voici ton impact pour le Royaume.</p>
      </div>

      {/* Stats 2x2 */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {STATS.map((s) => (
          <div key={s.label} className="rounded-[10px] bg-white p-4 shadow-1 dark:bg-gray-dark dark:shadow-card">
            <p className={`text-2xl font-bold ${s.couleur}`}>{s.val}</p>
            <p className="mt-0.5 text-xs text-dark-5 dark:text-dark-6">{s.label}</p>
          </div>
        ))}
      </div>

      {/* CTA Nouvelle rencontre */}
      <Link
        href="/evangeliste/terrain"
        className="mb-5 flex w-full items-center justify-center gap-2 rounded-[10px] bg-primary py-4 text-sm font-bold text-white shadow-md transition hover:bg-primary/90"
      >
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
        </svg>
        Nouvelle rencontre
      </Link>

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
                const badgeClass = r.priereSalut
                  ? "bg-green/10 text-green"
                  : r.guerison
                  ? "bg-[#FF9C55]/10 text-[#FF9C55]"
                  : r.priereSpontanee
                  ? "bg-[#8155FF]/10 text-[#8155FF]"
                  : "bg-gray-1 text-dark-5 dark:bg-dark-2 dark:text-dark-6";

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
                    <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${badgeClass}`}>
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
