export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProgrammesEvangelisteClient from "./_components/ProgrammesEvangelisteClient";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { syncStatutsProgrammes } from "@/actions/programme.actions";

export default async function ProgrammesEvangelistePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");

  const orgId = session.user.organizationId;
  const userId = session.user.id;

  // Sync automatique des statuts selon l'heure actuelle
  await syncStatutsProgrammes(orgId);

  const ORDRE_STATUT: Record<string, number> = { en_cours: 0, a_venir: 1, termine: 2 };

  const programmes = await prisma.programme.findMany({
    where: { organizationId: orgId },
    orderBy: { date: "asc" },
    select: {
      id: true,
      titre: true,
      lieu: true,
      date: true,
      statut: true,
      repartitionGroupes: true,
    },
  });

  // Résoudre les noms des membres pour chaque programme
  const allMemberIds = new Set<string>();
  for (const p of programmes) {
    let groupes: { groupe: number; membres: string[] }[] = [];
    try {
      const raw = p.repartitionGroupes;
      if (Array.isArray(raw)) groupes = raw as typeof groupes;
      else if (raw && typeof raw === "object" && "groupes" in raw)
        groupes = (raw as { groupes: typeof groupes }).groupes ?? [];
    } catch { /* skip */ }
    for (const g of groupes) g.membres.forEach((id) => allMemberIds.add(id));
  }

  const membres = allMemberIds.size > 0
    ? await prisma.user.findMany({
        where: { id: { in: Array.from(allMemberIds) } },
        select: { id: true, nom: true },
      })
    : [];
  const userMap = Object.fromEntries(membres.map((m) => [m.id, m.nom]));

  const sorties = programmes.map((p) => {
    let groupes: { groupe: number; membres: string[] }[] = [];
    try {
      const raw = p.repartitionGroupes;
      if (Array.isArray(raw)) groupes = raw as typeof groupes;
      else if (raw && typeof raw === "object" && "groupes" in raw)
        groupes = (raw as { groupes: typeof groupes }).groupes ?? [];
    } catch { /* skip */ }

    // Trouver le groupe de cet évangéliste
    const monGroupe = groupes.find((g) => g.membres.includes(userId));
    const tousLesNoms = groupes.flatMap((g) => g.membres.map((id) => userMap[id] ?? id));
    // Déduplique
    const evangelistes = [...new Set(tousLesNoms)];

    return {
      id: p.id,
      titre: p.titre,
      lieu: p.lieu,
      date: p.date.toISOString().split("T")[0],
      heure: `${String(p.date.getHours()).padStart(2, "0")}h${String(p.date.getMinutes()).padStart(2, "0")}`,
      statut: p.statut as string,
      evangelistes,
      monGroupeNumero: monGroupe?.groupe ?? null,
      monGroupeMembres: monGroupe ? monGroupe.membres.map((id) => userMap[id] ?? id) : [],
    };
  });

  sorties.sort((a, b) => (ORDRE_STATUT[a.statut] ?? 1) - (ORDRE_STATUT[b.statut] ?? 1));

  return (
    <>
      <Breadcrumb pageName="Programmes d'Évangélisation" />
      <ProgrammesEvangelisteClient sorties={sorties} />
    </>
  );
}
