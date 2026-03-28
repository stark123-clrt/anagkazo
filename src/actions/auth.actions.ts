"use server";

import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

interface RegisterData {
  nom: string;
  email: string;
  motdepasse: string;
  nomGroupe: string;
  ville: string;
  latitude: number;
  longitude: number;
}

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function registerAdmin(data: RegisterData): Promise<ActionResult> {
  const { nom, email, motdepasse, nomGroupe, ville, latitude, longitude } = data;

  // 1. Vérifier si l'email existe déjà
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { success: false, error: "Cette adresse email est déjà utilisée." };
  }

  // 2. Hasher le mot de passe
  const hashedPassword = await hash(motdepasse, 10);

  // 3. Transaction : créer Organization + User ensemble
  try {
    await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          nom: nomGroupe,
          ville,
          latitude,
          longitude,
        },
      });

      await tx.user.create({
        data: {
          nom,
          email,
          password: hashedPassword,
          role: "ADMIN",
          organizationId: organization.id,
        },
      });
    });

    return { success: true };
  } catch {
    return {
      success: false,
      error: "Une erreur est survenue lors de la création du compte. Veuillez réessayer.",
    };
  }
}
