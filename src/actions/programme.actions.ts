"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

interface Groupe {
  groupe: number;
  membres: string[]; // IDs des évangélistes
}

interface CreerProgrammeData {
  titre: string;
  lieu: string;
  date: string;       // ISO string "2026-04-17"
  heureDebut: string; // "14:00"
  heureFin: string;   // "16:00"
  groupes: Groupe[];
}

/**
 * Met à jour automatiquement les statuts des programmes selon l'heure actuelle :
 * - date passée ET pas de dateFin → en_cours
 * - dateFin passée → termine
 * - date future → a_venir
 */
export async function syncStatutsProgrammes(orgId: string): Promise<void> {
  const now = new Date();

  const programmes = await prisma.programme.findMany({
    where: {
      organizationId: orgId,
      statut: { in: ["a_venir", "en_cours"] },
    },
    select: { id: true, date: true, dateFin: true, statut: true },
  });

  for (const p of programmes) {
    let nouveauStatut: "a_venir" | "en_cours" | "termine" | null = null;

    if (p.dateFin && now >= p.dateFin) {
      // Heure de fin passée → terminé
      nouveauStatut = "termine";
    } else if (now >= p.date && p.statut === "a_venir") {
      // Heure de début passée → en cours
      nouveauStatut = "en_cours";
    }

    if (nouveauStatut && nouveauStatut !== p.statut) {
      await prisma.programme.update({
        where: { id: p.id },
        data: { statut: nouveauStatut },
      });
    }
  }
}

export async function modifierProgramme(
  id: string,
  data: CreerProgrammeData & { statut: string },
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return { error: "Accès refusé." };
  }

  const { titre, lieu, date, heureDebut, heureFin, groupes, statut } = data;
  if (!titre.trim() || !lieu.trim() || !date) {
    return { error: "Titre, lieu et date sont requis." };
  }

  const dateTime = new Date(`${date}T${heureDebut || "00:00"}:00`);
  const dateTimeFin = heureFin ? new Date(`${date}T${heureFin}:00`) : null;

  try {
    await prisma.programme.update({
      where: { id, organizationId: session.user.organizationId },
      data: {
        titre: titre.trim(),
        lieu: lieu.trim(),
        date: dateTime,
        dateFin: dateTimeFin,
        statut: statut as "a_venir" | "en_cours" | "termine",
        repartitionGroupes: groupes as object[],
      },
    });
  } catch {
    return { error: "Erreur lors de la modification." };
  }

  revalidatePath("/programmes");
  revalidatePath("/terrain");
  return {};
}

export async function supprimerProgramme(id: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return { error: "Accès refusé." };
  }

  try {
    await prisma.programme.delete({
      where: { id, organizationId: session.user.organizationId },
    });
  } catch {
    return { error: "Erreur lors de la suppression." };
  }

  revalidatePath("/programmes");
  return {};
}

export async function creerProgramme(data: CreerProgrammeData): Promise<{ error?: string }> {
  // 1. Sécurité — ADMIN uniquement
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Non autorisé. Veuillez vous reconnecter." };
  }
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return { error: "Accès refusé. Réservé aux administrateurs." };
  }

  const { titre, lieu, date, heureDebut, heureFin, groupes } = data;

  if (!titre.trim() || !lieu.trim() || !date) {
    return { error: "Titre, lieu et date sont requis." };
  }

  // 2. Construire la date complète avec l'heure de début et de fin
  const dateTime = new Date(`${date}T${heureDebut || "00:00"}:00`);
  const dateTimeFin = heureFin ? new Date(`${date}T${heureFin}:00`) : null;

  // Statut initial calculé selon l'heure actuelle
  const now = new Date();
  let statutInitial: "a_venir" | "en_cours" | "termine" = "a_venir";
  if (dateTimeFin && now >= dateTimeFin) statutInitial = "termine";
  else if (now >= dateTime) statutInitial = "en_cours";

  // 3. Créer le programme en base
  try {
    await prisma.programme.create({
      data: {
        titre: titre.trim(),
        lieu: lieu.trim(),
        date: dateTime,
        dateFin: dateTimeFin,
        statut: statutInitial,
        repartitionGroupes: groupes as object[],
        organizationId: session.user.organizationId,
      },
    });
  } catch {
    return { error: "Erreur lors de la création du programme. Veuillez réessayer." };
  }

  // 4. Revalider et rediriger
  revalidatePath("/programmes");
  redirect("/programmes");
}
