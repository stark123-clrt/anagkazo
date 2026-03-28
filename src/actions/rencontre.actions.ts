"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface RencontreData {
  personneNom: string;
  personneVille: string;
  latitude?: number | null;
  longitude?: number | null;
  religion: string;
  priereSpontanee: boolean;
  guerison: boolean;
  priereSalut: boolean;
  besoinEglise: boolean;
  contact: string | null;
  programmeId?: string | null;
  // Noms de tous les évangélistes du groupe (soi inclus)
  groupeEquipe?: string[];
}

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function sauvegarderRencontre(
  data: RencontreData,
): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user?.id || !session?.user?.organizationId) {
    return { success: false, error: "Non autorisé. Veuillez vous reconnecter." };
  }

  const evangelisteId = session.user.id;
  const organizationId = session.user.organizationId;

  if (!data.personneNom.trim() || !data.personneVille.trim()) {
    return { success: false, error: "Le nom et la ville sont requis." };
  }

  try {
    await prisma.rencontre.create({
      data: {
        personneNom: data.personneNom.trim(),
        personneVille: data.personneVille.trim(),
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        religion: data.religion || "Non précisé",
        priereSpontanee: data.priereSpontanee,
        guerison: data.guerison,
        priereSalut: data.priereSalut,
        besoinEglise: data.besoinEglise,
        contact: data.contact?.trim() || null,
        groupeEquipe: data.groupeEquipe ?? [],
        evangelisteId,
        organizationId,
        programmeId: data.programmeId ?? null,
      },
    });

    revalidatePath("/evangeliste");
    revalidatePath("/evangeliste/terrain");
    revalidatePath("/");

    return { success: true };
  } catch {
    return {
      success: false,
      error: "Erreur lors de l'enregistrement. Veuillez réessayer.",
    };
  }
}
