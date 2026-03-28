import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ProfileForms } from "@/app/(dashboard)/profile/_components/ProfileForms";

export const dynamic = "force-dynamic";

export default async function ProfilEvangelistePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      nom: true,
      email: true,
      _count: { select: { rencontres: true } },
      rencontres: { select: { priereSalut: true, guerison: true } },
    },
  });

  if (!user) redirect("/connexion");

  const totalSaluts = user.rencontres.filter((r) => r.priereSalut).length;
  const totalGuerisons = user.rencontres.filter((r) => r.guerison).length;

  return (
    <div className="mx-auto w-full max-w-[900px]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark dark:text-white">Mon Profil</h1>
        <p className="mt-0.5 text-sm text-dark-5 dark:text-dark-6">Gérez vos informations personnelles</p>
      </div>

      {/* EN-TÊTE */}
      <div className="mb-6 overflow-hidden rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
        <div className="flex flex-col items-center px-6 pt-8 pb-6">
          {/* Avatar */}
          <div className="mb-3 flex size-[88px] items-center justify-center rounded-full bg-primary text-2xl font-bold text-white">
            {user.nom.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div className="mb-5 text-center">
            <h2 className="text-xl font-bold text-dark dark:text-white">{user.nom}</h2>
            <p className="text-sm font-medium text-primary">Évangéliste</p>
          </div>

          {/* Stats */}
          <div className="grid w-full max-w-sm grid-cols-3 divide-x divide-stroke rounded-xl border border-stroke bg-gray-1 dark:divide-dark-3 dark:border-dark-3 dark:bg-dark-2">
            {[
              { val: user._count.rencontres, label: "Âmes", color: "text-primary" },
              { val: totalSaluts, label: "Saluts", color: "text-green" },
              { val: totalGuerisons, label: "Guérisons", color: "text-[#FF9C55]" },
            ].map((s) => (
              <div key={s.label} className="py-4 text-center">
                <p className={`text-2xl font-extrabold ${s.color}`}>{s.val}</p>
                <p className="mt-0.5 text-xs font-medium text-dark-5 dark:text-dark-6">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FORMULAIRES */}
      <ProfileForms nom={user.nom} email={user.email} />
    </div>
  );
}
