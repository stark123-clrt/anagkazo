import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export async function ChatsCard() {
  const session = await auth();
  const orgId = session?.user?.organizationId;

  if (!orgId) return null;

  const membres = await prisma.user.findMany({
    where: { organizationId: orgId, actif: true },
    orderBy: { nom: "asc" },
    take: 8,
    select: {
      id: true,
      nom: true,
      role: true,
      _count: {
        select: { rencontres: true },
      },
    },
  });

  if (membres.length === 0) return null;

  return (
    <div className="col-span-12 rounded-[10px] bg-white py-6 shadow-1 dark:bg-gray-dark dark:shadow-card xl:col-span-4">
      <h2 className="mb-5.5 px-7.5 text-body-2xlg font-bold text-dark dark:text-white">
        Membres de l&apos;Équipe
      </h2>

      <ul>
        {membres.map((m) => {
          const initiales = m.nom
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();

          const isAdmin = m.role === "ADMIN";

          return (
            <li key={m.id}>
              <div className="flex items-center gap-4.5 px-7.5 py-3">
                {/* Avatar avec initiales */}
                <div className="relative shrink-0">
                  <div
                    className={cn(
                      "flex size-14 items-center justify-center rounded-full text-sm font-bold",
                      isAdmin
                        ? "bg-primary/15 text-primary"
                        : "bg-green/15 text-green"
                    )}
                  >
                    {initiales}
                  </div>
                  <span className={cn(
                    "absolute bottom-0 right-0 size-3.5 rounded-full ring-2 ring-white dark:ring-dark-2",
                    isAdmin ? "bg-primary" : "bg-green"
                  )} />
                </div>

                <div className="flex-grow">
                  <h3 className="font-medium text-dark dark:text-white">{m.nom}</h3>
                  <div className="flex items-center gap-2 text-sm text-dark-5 dark:text-dark-6">
                    <span>{isAdmin ? "Admin" : "Évangéliste"}</span>
                    <span>·</span>
                    <span>
                      {m._count.rencontres} âme{m._count.rencontres !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* Badge nombre de rencontres */}
                {m._count.rencontres > 0 && (
                  <div className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">
                    {m._count.rencontres}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
