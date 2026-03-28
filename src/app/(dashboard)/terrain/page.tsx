import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import TerrainClient from "./_components/TerrainClient";
import { syncStatutsProgrammes } from "@/actions/programme.actions";

export default async function TerrainPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");

  const orgId = session.user.organizationId;
  const userId = session.user.id;

  // Sync automatique des statuts avant de chercher le programme actif
  await syncStatutsProgrammes(orgId);

  // Programme en_cours OU a_venir aujourd'hui
  const aujourd_hui_debut = new Date();
  aujourd_hui_debut.setHours(0, 0, 0, 0);
  const aujourd_hui_fin = new Date();
  aujourd_hui_fin.setHours(23, 59, 59, 999);

  const programme = await prisma.programme.findFirst({
    where: {
      organizationId: orgId,
      OR: [
        { statut: "en_cours" },
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

  const users = await prisma.user.findMany({
    where: { organizationId: orgId },
    select: { id: true, nom: true },
  });
  const userMap = Object.fromEntries(users.map((u) => [u.id, u.nom]));
  const monNom = userMap[userId] ?? (session.user.name ?? "");

  let sortie = null;
  if (programme) {
    let groupes: { groupe: number; membres: string[] }[] = [];
    try {
      const raw = programme.repartitionGroupes;
      if (Array.isArray(raw)) groupes = raw as typeof groupes;
      else if (raw && typeof raw === "object" && "groupes" in raw)
        groupes = (raw as { groupes: typeof groupes }).groupes ?? [];
    } catch { /* skip */ }

    // Trouver le groupe de l'admin
    const monGroupe = groupes.find((g) => g.membres.includes(userId));
    const coequipiersNoms = monGroupe
      ? monGroupe.membres.filter((id) => id !== userId).map((id) => userMap[id] ?? id)
      : [];

    sortie = {
      id: programme.id,
      titre: programme.titre,
      lieu: programme.lieu,
      heureDebut: `${String(programme.date.getHours()).padStart(2, "0")}:${String(programme.date.getMinutes()).padStart(2, "0")}`,
      statut: programme.statut as string,
      groupeNumero: monGroupe?.groupe ?? null,
      coequipiers: coequipiersNoms,
      // Pour affichage des tous les groupes (vue admin)
      tousGroupes: groupes.map((g) => ({
        groupe: g.groupe,
        noms: g.membres.map((id) => userMap[id] ?? id),
      })),
    };
  }

  return (
    <>
      <Breadcrumb pageName="Enregistrer une Rencontre" />
      <TerrainClient sortie={sortie} monNom={monNom} />
    </>
  );
}
