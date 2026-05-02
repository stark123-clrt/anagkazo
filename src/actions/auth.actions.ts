"use server";

import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { randomUUID } from "crypto";
import nodemailer from "nodemailer";

async function envoyerMailVerification(email: string, nom: string, token: string) {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const lien = `${baseUrl}/verifier-email/${token}`;

  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT ?? 587),
    secure: false,
    tls: { rejectUnauthorized: false },
    auth: { user: process.env.MAIL_USERNAME, pass: process.env.MAIL_PASSWORD },
  });

  await transporter.sendMail({
    from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
    to: email,
    subject: "Confirmez votre adresse email — Anagkazo",
    html: `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="background:#020D1A;padding:32px 40px;text-align:center;">
            <p style="margin:0;color:#5750F1;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Anagkazo</p>
            <h1 style="margin:10px 0 0;color:#ffffff;font-size:20px;font-weight:700;">Confirmez votre adresse email</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 16px;color:#1a1a2e;font-size:15px;">Bonjour <strong>${nom}</strong>,</p>
            <p style="margin:0 0 24px;color:#4a4a6a;font-size:14px;line-height:1.7;">
              Votre espace Anagkazo a été créé avec succès. Pour activer votre compte et commencer à utiliser l'application, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding:8px 0 32px;">
                  <a href="${lien}" style="display:inline-block;background:#5750F1;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:14px 40px;border-radius:8px;">
                    Confirmer mon adresse email
                  </a>
                </td>
              </tr>
            </table>
            <p style="color:#888;font-size:12px;">Ce lien expire dans 24 heures. Si vous n'avez pas créé ce compte, ignorez cet email.</p>
            <p style="color:#888;font-size:12px;">Anagkazo</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

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

  const emailVerifToken = randomUUID();
  const emailVerifExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

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
          actif: false,
          emailVerifToken,
          emailVerifExpiry,
          organizationId: orgExistante.id,
        },
      });
    } else {
      // Créer une nouvelle org + admin
      await prisma.$transaction(async (tx) => {
        const organization = await tx.organization.create({
          data: { nom: nomGroupe, ville, latitude, longitude },
        });
        await tx.user.create({
          data: {
            nom,
            email,
            password: hashedPassword,
            role: "ADMIN",
            actif: false,
            emailVerifToken,
            emailVerifExpiry,
            organizationId: organization.id,
          },
        });
      });
    }

    // Envoyer le mail de vérification (non bloquant)
    try {
      await envoyerMailVerification(email, nom, emailVerifToken);
    } catch (mailErr) {
      console.error("[REGISTER] Erreur envoi mail vérification:", mailErr);
    }

    return { success: true };
  } catch {
    return { success: false, error: "Une erreur est survenue lors de la création du compte. Veuillez réessayer." };
  }
}

export async function verifierEmail(token: string): Promise<{ success: boolean; error?: string }> {
  const user = await prisma.user.findUnique({
    where: { emailVerifToken: token },
    select: { id: true, emailVerifExpiry: true, actif: true },
  });

  if (!user) return { success: false, error: "Lien invalide ou déjà utilisé." };
  if (user.actif) return { success: true }; // déjà vérifié
  if (!user.emailVerifExpiry || user.emailVerifExpiry < new Date()) {
    return { success: false, error: "Ce lien a expiré. Contactez le support." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { actif: true, emailVerified: true, emailVerifToken: null, emailVerifExpiry: null },
  });

  return { success: true };
}
