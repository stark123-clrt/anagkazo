import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getOverviewData() {
  const session = await auth();
  const orgId = session?.user?.organizationId;

  if (!orgId) {
    return {
      totalAmes: 0,
      totalSaluts: 0,
      totalPrieres: 0,
      totalGuerisons: 0,
    };
  }

  const [totalAmes, totalSaluts, totalPrieres, totalGuerisons] =
    await Promise.all([
      prisma.rencontre.count({ where: { organizationId: orgId } }),
      prisma.rencontre.count({ where: { organizationId: orgId, priereSalut: true } }),
      prisma.rencontre.count({ where: { organizationId: orgId, priereSpontanee: true } }),
      prisma.rencontre.count({ where: { organizationId: orgId, guerison: true } }),
    ]);

  return { totalAmes, totalSaluts, totalPrieres, totalGuerisons };
}

export async function getDernieresRencontres() {
  const session = await auth();
  const orgId = session?.user?.organizationId;

  if (!orgId) return [];

  return prisma.rencontre.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      personneNom: true,
      personneVille: true,
      religion: true,
      priereSalut: true,
      guerison: true,
      priereSpontanee: true,
      createdAt: true,
      evangeliste: { select: { nom: true } },
    },
  });
}

export async function getChatsData() {
  return [
    {
      name: "Jean-Paul M.",
      profile: "/images/user/user-01.png",
      isActive: true,
      lastMessage: {
        content: "J'ai abordé 12 personnes ce matin à Paris 18ème",
        type: "text",
        timestamp: "2026-03-26T14:30:00Z",
        isRead: false,
      },
      unreadCount: 3,
    },
    {
      name: "Marie-Claire D.",
      profile: "/images/user/user-03.png",
      isActive: true,
      lastMessage: {
        content: "2 prières du salut à Lyon ce soir, Gloire à Dieu!",
        type: "text",
        timestamp: "2026-03-26T10:15:00Z",
        isRead: true,
      },
      unreadCount: 0,
    },
    {
      name: "Pierre L.",
      profile: "/images/user/user-04.png",
      isActive: false,
      lastMessage: {
        content: "Sortie à Marseille prévue pour demain",
        type: "text",
        timestamp: "2026-03-26T09:00:00Z",
        isRead: true,
      },
      unreadCount: 0,
    },
    {
      name: "Esther K.",
      profile: "/images/user/user-05.png",
      isActive: true,
      lastMessage: {
        content: "3 guérisons signalées lors de la sortie du quartier",
        type: "text",
        timestamp: "2026-03-26T11:45:00Z",
        isRead: false,
      },
      unreadCount: 2,
    },
    {
      name: "Samuel N.",
      profile: "/images/user/user-07.png",
      isActive: false,
      lastMessage: {
        content: "Rapport de la semaine envoyé",
        type: "text",
        timestamp: "2026-03-25T18:00:00Z",
        isRead: true,
      },
      unreadCount: 0,
    },
  ];
}
