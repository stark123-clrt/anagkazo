export const dynamic = "force-dynamic";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProgrammesClient from "./_components/ProgrammesClient";
import { syncStatutsProgrammes } from "@/actions/programme.actions";

export default async function ProgrammesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");

  const orgId = session.user.organizationId;
  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";

  // Sync automatique des statuts selon l'heure actuelle
  await syncStatutsProgrammes(orgId);

  const [programmes, users] = await Promise.all([
    prisma.programme.findMany({
      where: { organizationId: orgId },
      orderBy: { date: "desc" },
      select: {
        id: true,
        titre: true,
        lieu: true,
        date: true,
        statut: true,
        repartitionGroupes: true,
        createdAt: true,
        _count: { select: { rencontres: true } },
      },
    }),
    prisma.user.findMany({
      where: { organizationId: orgId, actif: true },
      select: { id: true, nom: true },
      orderBy: { nom: "asc" },
    }),
  ]);

  const userMap = Object.fromEntries(users.map((u) => [u.id, u.nom]));

  const programmesData = programmes.map((p) => {
    let groupes: { groupe: number; membres: string[] }[] = [];
    try {
      const raw = p.repartitionGroupes as { groupes?: { groupe: number; membres: string[] }[] } | null;
      groupes = raw?.groupes ?? [];
    } catch {
      groupes = [];
    }

    const totalEvangRepartis = groupes.reduce((s, g) => s + g.membres.length, 0);
    const nomsEvang = groupes
      .flatMap((g) => g.membres)
      .map((id) => userMap[id] ?? id)
      .filter(Boolean);

    // Groupes avec noms pour affichage terrain
    const groupesAvecNoms = groupes.map((g) => ({
      groupe: g.groupe,
      membres: g.membres,
      nomsM: g.membres.map((id) => userMap[id] ?? id),
    }));

    return {
      id: p.id,
      titre: p.titre,
      lieu: p.lieu,
      date: p.date.toISOString(),
      statut: p.statut as string,
      nbGroupes: groupes.length,
      nbEvangRepartis: totalEvangRepartis,
      nomsEvang,
      nbRencontres: p._count.rencontres,
      groupesDetail: groupesAvecNoms,
    };
  });

  return (
    <>
      <Breadcrumb pageName="Programmes d'Évangélisation" />
      <ProgrammesClient
        programmes={programmesData}
        evangelistes={users}
        isAdmin={isAdmin}
      />
    </>
  );
}
