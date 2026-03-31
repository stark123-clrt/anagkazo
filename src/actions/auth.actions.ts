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
  codeAdmin?: string;
}

export async function verifierOrgExistante(ville: string): Promise<{ existe: boolean; nom?: string; nbAdmins?: number }> {
  const org = await prisma.organization.findFirst({
    where: { ville: { equals: ville, mode: "insensitive" } },
    select: {
      nom: true,
      _count: { select: { users: { where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } } } } },
    },
  });

  if (!org) return { existe: false };
  return { existe: true, nom: org.nom, nbAdmins: org._count.users };
}

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function registerAdmin(data: RegisterData): Promise<ActionResult> {
  const { nom, email, motdepasse, nomGroupe, ville, latitude, longitude } = data;

  // 1. Vérifier si l'email existe déjà
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { success: false, error: "Cette adresse email est déjà utilisée." };
  }

  // 2. Hasher le mot de passe
  const hashedPassword = await hash(motdepasse, 10);

  // 3. Chercher si une org existe déjà pour cette ville
  const orgExistante = await prisma.organization.findFirst({
    where: { ville: { equals: ville, mode: "insensitive" } },
    select: {
      id: true,
      _count: { select: { users: { where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } } } } },
    },
  });

  try {
    if (orgExistante) {
      // Vérifier la limite de 3 admins
      if (orgExistante._count.users >= 3) {
        return { success: false, error: "L'espace de cette ville a déjà 3 administrateurs. Contactez le SUPER_ADMIN." };
      }

      // Rejoindre l'org existante
      await prisma.user.create({
        data: {
          nom,
          email,
          password: hashedPassword,
          role: "ADMIN",
          organizationId: orgExistante.id,
        },
      });
    } else {
      // Créer une nouvelle org + admin
      await prisma.$transaction(async (tx: typeof prisma) => {
        const organization = await tx.organization.create({
          data: { nom: nomGroupe, ville, latitude, longitude },
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
    }

    return { success: true };
  } catch {
    return { success: false, error: "Une erreur est survenue lors de la création du compte. Veuillez réessayer." };
  }
}
