"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { randomBytes } from "crypto";

function assertSuperAdmin(role: string | undefined) {
  if (role !== "SUPER_ADMIN") throw new Error("Accès refusé");
}

export async function genererCodeAdmin() {
  const session = await auth();
  assertSuperAdmin((session?.user as any)?.role);

  const code = randomBytes(6).toString("hex").toUpperCase(); // ex: A3F9C2
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours

  const invitation = await prisma.invitationAdmin.create({
    data: { code, expiresAt },
  });

  return { success: true, invitation };
}

export async function validerCodeAdmin(code: string) {
  const invitation = await prisma.invitationAdmin.findUnique({
    where: { code },
  });

  if (!invitation) return { valide: false, error: "Code invalide." };
  if (invitation.usedAt) return { valide: false, error: "Ce code a déjà été utilisé." };
  if (invitation.expiresAt < new Date()) return { valide: false, error: "Ce code a expiré." };

  return { valide: true };
}

export async function consommerCodeAdmin(code: string) {
  await prisma.invitationAdmin.update({
    where: { code },
    data: { usedAt: new Date() },
  });
}

export async function supprimerCodeAdmin(id: string) {
  const session = await auth();
  assertSuperAdmin((session?.user as any)?.role);
  await prisma.invitationAdmin.delete({ where: { id } });
  return { success: true };
}

export async function listerInvitationsAdmin() {
  const session = await auth();
  assertSuperAdmin((session?.user as any)?.role);

  return prisma.invitationAdmin.findMany({
    orderBy: { createdAt: "desc" },
  });
}
