"use server";

import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

interface ActivationResult {
  success: boolean;
  error?: string;
  nom?: string;
  orgNom?: string;
}

export async function getInvitation(token: string): Promise<{
  valid: boolean;
  nom?: string;
  email?: string;
  orgNom?: string;
  error?: string;
}> {
  const user = await prisma.user.findUnique({
    where: { invitationToken: token },
    select: {
      nom: true,
      email: true,
      actif: true,
      invitationExpiry: true,
      organization: { select: { nom: true } },
    },
  });

  if (!user) return { valid: false, error: "Lien invalide ou déjà utilisé." };
  if (user.actif) return { valid: false, error: "Ce compte est déjà activé. Connectez-vous." };
  if (!user.invitationExpiry || user.invitationExpiry < new Date()) {
    return { valid: false, error: "Ce lien a expiré. Demandez un nouvel envoi à votre administrateur." };
  }

  return {
    valid: true,
    nom: user.nom,
    email: user.email,
    orgNom: user.organization.nom,
  };
}

export async function activerCompte(
  token: string,
  motDePasse: string,
): Promise<ActivationResult> {
  if (!motDePasse || motDePasse.length < 8) {
    return { success: false, error: "Le mot de passe doit contenir au moins 8 caractères." };
  }

  const user = await prisma.user.findUnique({
    where: { invitationToken: token },
    select: {
      id: true,
      actif: true,
      invitationExpiry: true,
      nom: true,
      organization: { select: { nom: true } },
    },
  });

  if (!user) return { success: false, error: "Lien invalide ou déjà utilisé." };
  if (user.actif) return { success: false, error: "Ce compte est déjà activé." };
  if (!user.invitationExpiry || user.invitationExpiry < new Date()) {
    return { success: false, error: "Ce lien a expiré. Demandez un nouvel envoi à votre administrateur." };
  }

  const hashedPassword = await hash(motDePasse, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      actif: true,
      invitationToken: null,
      invitationExpiry: null,
    },
  });

  return { success: true, nom: user.nom, orgNom: user.organization.nom };
}
