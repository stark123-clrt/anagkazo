export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import AmesEvangelisteClient from "./_components/AmesEvangelisteClient";

export default async function AmesEvangelistePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");

  const userId = session.user.id;
  const orgId = session.user.organizationId;

  const rencontres = await prisma.rencontre.findMany({
    where: { organizationId: orgId, evangelisteId: userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      personneNom: true,
      personneVille: true,
      religion: true,
      priereSalut: true,
      guerison: true,
      priereSpontanee: true,
      contact: true,
      suivi: true,
      groupeEquipe: true,
      createdAt: true,
    },
  });

  const ames = rencontres.map((r) => ({
    id: r.id,
    nom: r.personneNom,
    ville: r.personneVille,
    religion: r.religion,
    salut: r.priereSalut,
    guerison: r.guerison,
    priereSpontanee: r.priereSpontanee,
    contact: r.contact ?? "",
    suivi: r.suivi,
    groupeEquipe: r.groupeEquipe,
    date: new Date(r.createdAt).toLocaleDateString("fr-FR", {
      day: "numeric", month: "short", year: "numeric",
    }),
  }));

  const religions = ["Toutes", ...Array.from(new Set(rencontres.map((r) => r.religion))).sort()];

  const stats = {
    total: ames.length,
    saluts: ames.filter((a) => a.salut).length,
    guerisons: ames.filter((a) => a.guerison).length,
    aRecontacter: ames.filter((a) => !a.salut).length,
  };


  return (
    <>
      <Breadcrumb pageName="Mes Âmes Touchées" />
      <AmesEvangelisteClient ames={ames} religions={religions} stats={stats} />
    </>
  );
}
