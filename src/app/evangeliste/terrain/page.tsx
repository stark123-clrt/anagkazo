export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import TerrainForm from "./_components/TerrainForm";
import { syncStatutsProgrammes } from "@/actions/programme.actions";

export default async function TerrainEvangelistePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");

  const userId = session.user.id;
  const orgId = session.user.organizationId;

  // Sync automatique des statuts avant de chercher le programme actif
  await syncStatutsProgrammes(orgId);

  // Chercher d'abord un programme en_cours, sinon le prochain a_venir du jour
  const aujourd_hui_debut = new Date();
  aujourd_hui_debut.setHours(0, 0, 0, 0);
  const aujourd_hui_fin = new Date();
  aujourd_hui_fin.setHours(23, 59, 59, 999);

  const programmeEnCours = await prisma.programme.findFirst({
    where: {
      organizationId: orgId,
      OR: [
        { statut: "en_cours" },
        // Programme prévu aujourd'hui (a_venir)
        { statut: "a_venir", date: { gte: aujourd_hui_debut, lte: aujourd_hui_fin } },
      ],
    },
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

  // Résoudre le groupe de l'évangéliste dans ce programme
  let groupeInfo: { numero: number; coequipiers: string[] } | null = null;

  if (programmeEnCours) {
    let groupes: { groupe: number; membres: string[] }[] = [];
    try {
      const raw = programmeEnCours.repartitionGroupes;
      if (Array.isArray(raw)) groupes = raw as typeof groupes;
      else if (raw && typeof raw === "object" && "groupes" in raw)
        groupes = (raw as { groupes: typeof groupes }).groupes ?? [];
    } catch { /* skip */ }

    // Trouver le groupe qui contient cet évangéliste
    const monGroupe = groupes.find((g) => g.membres.includes(userId));

    if (monGroupe) {
      // Récupérer les noms des coéquipiers (sauf soi-même)
      const coequipiersIds = monGroupe.membres.filter((id) => id !== userId);
      const coequipiers = coequipiersIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: coequipiersIds } },
            select: { nom: true },
          })
        : [];

      groupeInfo = {
        numero: monGroupe.groupe,
        coequipiers: coequipiers.map((u) => u.nom),
      };
    }
  }

  const heureDebut = programmeEnCours
    ? `${String(programmeEnCours.date.getHours()).padStart(2, "0")}:${String(programmeEnCours.date.getMinutes()).padStart(2, "0")}`
    : null;

  // N'afficher le programme que si l'évangéliste est assigné dans un groupe
  const programmeVisible = programmeEnCours && groupeInfo ? {
    id: programmeEnCours.id,
    titre: programmeEnCours.titre,
    lieu: programmeEnCours.lieu,
    heureDebut: heureDebut!,
    statut: programmeEnCours.statut as string,
    groupeNumero: groupeInfo.numero,
    coequipiers: groupeInfo.coequipiers,
  } : null;

  return (
    <TerrainForm
      monNom={session.user.name ?? session.user.email ?? ""}
      programmeEnCours={programmeVisible}
    />
  );
}
