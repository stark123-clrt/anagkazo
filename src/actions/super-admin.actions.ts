"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

interface ActionResult {
  success: boolean;
  error?: string;
}

// Lister toutes les organisations avec leurs admins
export async function listerOrganisations(): Promise<{
  id: string;
  nom: string;
  ville: string;
  admins: { id: string; nom: string; email: string; actif: boolean }[];
}[]> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "SUPER_ADMIN") throw new Error("Accès refusé.");

  const orgs = await prisma.organization.findMany({
    orderBy: { nom: "asc" },
    select: {
      id: true,
      nom: true,
      ville: true,
      users: {
        where: { role: "ADMIN" },
        select: { id: true, nom: true, email: true, actif: true },
        orderBy: { nom: "asc" },
      },
    },
  });

  return orgs.map((o) => ({
    id: o.id,
    nom: o.nom,
    ville: o.ville ?? null,
    admins: o.users,
  }));
}

// Suspendre un admin (n'importe quelle org)
export async function suspendreAdminGlobal(userId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "SUPER_ADMIN")
    return { success: false, error: "Accès refusé." };
  if (userId === session.user.id)
    return { success: false, error: "Impossible de se suspendre soi-même." };

  const cible = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!cible) return { success: false, error: "Utilisateur introuvable." };
  if (cible.role !== "ADMIN") return { success: false, error: "Cet utilisateur n'est pas un admin." };

  await prisma.user.update({ where: { id: userId }, data: { actif: false } });
  revalidatePath("/equipe");
  return { success: true };
}

// Réactiver un admin (n'importe quelle org)
export async function reactiverAdminGlobal(userId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "SUPER_ADMIN")
    return { success: false, error: "Accès refusé." };

  const cible = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!cible) return { success: false, error: "Utilisateur introuvable." };

  await prisma.user.update({ where: { id: userId }, data: { actif: true } });
  revalidatePath("/equipe");
  return { success: true };
}

// Supprimer un admin (n'importe quelle org)
export async function supprimerAdminGlobal(userId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "SUPER_ADMIN")
    return { success: false, error: "Accès refusé." };
  if (userId === session.user.id)
    return { success: false, error: "Impossible de se supprimer soi-même." };

  const cible = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, nom: true },
  });
  if (!cible) return { success: false, error: "Utilisateur introuvable." };
  if (cible.role !== "ADMIN") return { success: false, error: "Cet utilisateur n'est pas un admin." };

  // Réassigner ses rencontres au SUPER_ADMIN
  const rencontres = await prisma.rencontre.findMany({
    where: { evangelisteId: userId },
    select: { id: true, groupeEquipe: true },
  });
  for (const r of rencontres) {
    const equipe = r.groupeEquipe.length > 0 ? r.groupeEquipe : [cible.nom];
    await prisma.rencontre.update({
      where: { id: r.id },
      data: {
        evangelisteId: session.user.id,
        groupeEquipe: equipe.includes(cible.nom) ? equipe : [cible.nom, ...equipe],
      },
    });
  }

  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/equipe");
  return { success: true };
}
