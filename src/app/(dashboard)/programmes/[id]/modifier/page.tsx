import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import NouveauProgrammeForm from "../../nouveau/_components/NouveauProgrammeForm";

export default async function ModifierProgrammePage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") redirect("/programmes");

  const orgId = session.user.organizationId;

  const [programme, users] = await Promise.all([
    prisma.programme.findFirst({
      where: { id: params.id, organizationId: orgId },
      select: {
        id: true,
        titre: true,
        lieu: true,
        date: true,
        statut: true,
        repartitionGroupes: true,
      },
    }),
    prisma.user.findMany({
      where: { organizationId: orgId, actif: true },
      select: { id: true, nom: true },
      orderBy: { nom: "asc" },
    }),
  ]);

  if (!programme) notFound();

  // Parser les groupes — stockés comme tableau direct [{groupe:1, membres:[...]}, ...]
  let groupes: { groupe: number; membres: string[] }[] = [];
  try {
    const raw = programme.repartitionGroupes;
    if (Array.isArray(raw)) {
      groupes = raw as { groupe: number; membres: string[] }[];
    } else if (raw && typeof raw === "object" && "groupes" in raw) {
      groupes = (raw as { groupes: { groupe: number; membres: string[] }[] }).groupes ?? [];
    }
  } catch { groupes = []; }

  const dateObj = programme.date;
  const dateStr = dateObj.toISOString().slice(0, 10);
  const heureStr = `${String(dateObj.getHours()).padStart(2, "0")}:${String(dateObj.getMinutes()).padStart(2, "0")}`;

  return (
    <>
      <Breadcrumb pageName="Modifier le programme" />
      <NouveauProgrammeForm
        evangelistes={users}
        initial={{
          id: programme.id,
          titre: programme.titre,
          lieu: programme.lieu,
          date: dateStr,
          heureDebut: heureStr,
          heureFin: heureStr,
          statut: programme.statut as string,
          groupes,
        }}
      />
    </>
  );
}
