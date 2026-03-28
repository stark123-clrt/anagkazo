"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleSuiviAme(id: string): Promise<{ error?: string; suivi?: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non autorisé." };

  const rencontre = await prisma.rencontre.findFirst({
    where: { id, organizationId: session.user.organizationId },
    select: { suivi: true },
  });
  if (!rencontre) return { error: "Introuvable." };

  const updated = await prisma.rencontre.update({
    where: { id },
    data: { suivi: !rencontre.suivi },
    select: { suivi: true },
  });

  revalidatePath("/ames");
  return { suivi: updated.suivi };
}

export async function supprimerAme(id: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") return { error: "Accès refusé." };

  await prisma.rencontre.deleteMany({
    where: { id, organizationId: session.user.organizationId },
  });

  revalidatePath("/ames");
  return {};
}
