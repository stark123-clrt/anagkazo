export const dynamic = "force-dynamic";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import EquipeClient from "./_components/EquipeClient";

export default async function EquipePage() {
  const session = await auth();

  if (!session?.user?.id) redirect("/connexion");

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";
  const orgId = session.user.organizationId;

  const membres = await prisma.user.findMany({
    where: { organizationId: orgId },
    orderBy: { nom: "asc" },
    select: {
      id: true,
      nom: true,
      email: true,
      role: true,
      actif: true,
      invitationToken: true,
      createdAt: true,
      _count: {
        select: {
          rencontres: true,
        },
      },
      rencontres: {
        select: {
          priereSalut: true,
          guerison: true,
          createdAt: true,
        },
      },
    },
  });

  // Calculer les stats par membre
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const membresAvecStats = membres.map((m) => {
    const semaineAmes = m.rencontres.filter(
      (r) => new Date(r.createdAt) >= startOfWeek
    ).length;
    const totalSaluts = m.rencontres.filter((r) => r.priereSalut).length;
    const totalGuerisons = m.rencontres.filter((r) => r.guerison).length;
    const derniereRencontre = m.rencontres.length > 0
      ? m.rencontres.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt
      : null;

    return {
      id: m.id,
      nom: m.nom,
      email: m.email,
      role: m.role as string,
      actif: m.actif,
      invitationEnCours: !!m.invitationToken,
      createdAt: m.createdAt,
      totalAmes: m._count.rencontres,
      semaineAmes,
      totalSaluts,
      totalGuerisons,
      derniereRencontre,
    };
  });

  return (
    <>
      <Breadcrumb pageName="Gestion de l'Équipe" />
      <EquipeClient membres={membresAvecStats} isAdmin={isAdmin} isSuperAdmin={session.user.role === "SUPER_ADMIN"} />
    </>
  );
}
