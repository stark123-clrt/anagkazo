import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import NouveauProgrammeForm from "./_components/NouveauProgrammeForm";

export default async function NouveauProgrammePage() {
  const session = await auth();

  // Seuls les admins accèdent à cette page
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/");
  }

  // Charger les évangélistes de l'organisation depuis Prisma
  const evangelistes = await prisma.user.findMany({
    where: {
      organizationId: session.user.organizationId,
      actif: true,
    },
    select: { id: true, nom: true },
    orderBy: { nom: "asc" },
  });

  return (
    <>
      <Breadcrumb pageName="Nouveau Programme" />
      <NouveauProgrammeForm evangelistes={evangelistes} />
    </>
  );
}
