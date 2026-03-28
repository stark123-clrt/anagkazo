"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { compare, hash } from "bcryptjs";
import { revalidatePath } from "next/cache";

export interface UpdateProfileResult {
  success: boolean;
  error?: string;
}

export async function updateProfileInfos(data: {
  nom: string;
}): Promise<UpdateProfileResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Non autorisé." };
  }

  const nom = data.nom.trim();
  if (!nom) return { success: false, error: "Le nom est requis." };

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { nom },
    });
    revalidatePath("/profile");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la mise à jour." };
  }
}

export async function updatePassword(data: {
  actuel: string;
  nouveau: string;
}): Promise<UpdateProfileResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Non autorisé." };
  }

  if (data.nouveau.length < 8) {
    return { success: false, error: "Le mot de passe doit contenir au moins 8 caractères." };
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { success: false, error: "Utilisateur introuvable." };

  const motDePasseOk = await compare(data.actuel, user.password);
  if (!motDePasseOk) {
    return { success: false, error: "Mot de passe actuel incorrect." };
  }

  const hashedPassword = await hash(data.nouveau, 10);

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });
    revalidatePath("/profile");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors du changement de mot de passe." };
  }
}
