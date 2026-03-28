export const dynamic = "force-dynamic";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AmesClient from "./_components/AmesClient";

type SearchParams = Promise<{
  q?: string;
  religion?: string;
  salut?: string;
  highlight?: string;
}>;

export default async function AmesPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");

  await searchParams; // consommer les params (filtres gérés côté client)
  const orgId = session.user.organizationId;

  const [rencontres, totalAmes, totalSaluts, totalGuerisons, evangelistes, programmes] = await Promise.all([
    prisma.rencontre.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        personneNom: true,
        personneVille: true,
        religion: true,
        priereSalut: true,
        guerison: true,
        priereSpontanee: true,
        besoinEglise: true,
        contact: true,
        suivi: true,
        groupeEquipe: true,
        createdAt: true,
        evangelisteId: true,
        programmeId: true,
        evangeliste: { select: { nom: true } },
      },
    }),
    prisma.rencontre.count({ where: { organizationId: orgId } }),
    prisma.rencontre.count({ where: { organizationId: orgId, priereSalut: true } }),
    prisma.rencontre.count({ where: { organizationId: orgId, guerison: true } }),
    // Liste des évangélistes pour le filtre
    prisma.user.findMany({
      where: { organizationId: orgId },
      select: { id: true, nom: true },
      orderBy: { nom: "asc" },
    }),
    // Programmes avec leurs groupes pour le filtre par groupe
    prisma.programme.findMany({
      where: { organizationId: orgId },
      select: {
        id: true,
        titre: true,
        date: true,
        repartitionGroupes: true,
      },
      orderBy: { date: "desc" },
    }),
  ]);

  const ames = rencontres.map((r) => ({
    id: r.id,
    nom: r.personneNom,
    ville: r.personneVille,
    religion: r.religion,
    salut: r.priereSalut,
    guerison: r.guerison,
    priereSpontanee: r.priereSpontanee,
    besoinEglise: r.besoinEglise,
    contact: r.contact ?? "",
    suivi: r.suivi,
    groupeEquipe: r.groupeEquipe,
    evangelisteId: r.evangelisteId,
    evangeliste: r.evangeliste.nom,
    programmeId: r.programmeId ?? null,
    date: new Date(r.createdAt).toLocaleDateString("fr-FR", {
      day: "numeric", month: "short", year: "numeric",
    }),
    createdAt: r.createdAt.toISOString(),
  }));

  // Construire la liste des groupes à partir des programmes
  // Chaque groupe = { id: "progId-1", label: "Programme X — Groupe 1", membres: [userId, ...] }
  const groupesFiltres: { id: string; label: string; membres: string[] }[] = [];
  for (const prog of programmes) {
    let groupes: { groupe: number; membres: string[] }[] = [];
    try {
      const raw = prog.repartitionGroupes;
      if (Array.isArray(raw)) groupes = raw as typeof groupes;
      else if (raw && typeof raw === "object" && "groupes" in raw)
        groupes = (raw as { groupes: typeof groupes }).groupes ?? [];
    } catch { /* skip */ }

    const dateLabel = new Date(prog.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    for (const g of groupes) {
      groupesFiltres.push({
        id: `${prog.id}-${g.groupe}`,
        label: `${dateLabel} — Groupe ${g.groupe}`,
        membres: g.membres,
      });
    }
  }

  const religions = [
    "Toutes",
    ...Array.from(new Set(rencontres.map((r) => r.religion))).sort(),
  ];

  return (
    <>
      <Breadcrumb pageName="Annuaire des Âmes Touchées" />
      <AmesClient
        ames={ames}
        religions={religions}
        evangelistes={evangelistes}
        groupesFiltres={groupesFiltres}
        isAdmin={session.user.role === "ADMIN"}
        stats={{
          total: totalAmes,
          saluts: totalSaluts,
          guerisons: totalGuerisons,
          aRecontacter: totalAmes - totalSaluts,
        }}
      />
    </>
  );
}
