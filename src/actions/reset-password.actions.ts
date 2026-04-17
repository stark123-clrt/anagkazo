"use server";

import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { randomUUID } from "crypto";
import nodemailer from "nodemailer";

export async function demanderResetPassword(email: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const emailNorm = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: emailNorm },
    select: { id: true, nom: true, actif: true },
  });

  // On ne révèle pas si l'email existe ou non (sécurité)
  if (!user || !user.actif) {
    return { success: true };
  }

  const token = randomUUID();
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken: token, resetExpiry: expiry },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const lien = `${baseUrl}/reinitialisation/${token}`;

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT ?? 587),
      secure: false,
      tls: { rejectUnauthorized: false },
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
      to: emailNorm,
      subject: "Réinitialisation de votre mot de passe — Walking by faith & love",
      html: `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="background:#020D1A;padding:32px 40px;text-align:center;">
            <p style="margin:0;color:#5750F1;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Walking by faith & love</p>
            <h1 style="margin:10px 0 0;color:#ffffff;font-size:20px;font-weight:700;">Réinitialisation du mot de passe</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 16px;color:#1a1a2e;font-size:15px;">Bonjour <strong>${user.nom}</strong>,</p>
            <p style="margin:0 0 24px;color:#4a4a6a;font-size:14px;line-height:1.7;">
              Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding:8px 0 32px;">
                  <a href="${lien}" style="display:inline-block;background:#5750F1;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:14px 40px;border-radius:8px;">
                    Réinitialiser mon mot de passe
                  </a>
                </td>
              </tr>
            </table>
            <p style="color:#888;font-size:12px;">Ce lien expire dans 1 heure. Si vous n'avez pas fait cette demande, ignorez cet email.</p>
            <p style="color:#888;font-size:12px;">Walking by faith & love</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });
  } catch (e) {
    console.error("[RESET PASSWORD] Erreur mail:", e);
  }

  return { success: true };
}

export async function validerResetToken(token: string): Promise<{
  valid: boolean;
  nom?: string;
  email?: string;
  error?: string;
}> {
  const user = await prisma.user.findUnique({
    where: { resetToken: token },
    select: { nom: true, email: true, resetExpiry: true },
  });

  if (!user) return { valid: false, error: "Lien invalide ou déjà utilisé." };
  if (!user.resetExpiry || user.resetExpiry < new Date()) {
    return { valid: false, error: "Ce lien a expiré. Faites une nouvelle demande." };
  }

  return { valid: true, nom: user.nom, email: user.email };
}

export async function reinitialiserMotDePasse(
  token: string,
  motDePasse: string,
): Promise<{ success: boolean; error?: string }> {
  if (!motDePasse || motDePasse.length < 8) {
    return { success: false, error: "Le mot de passe doit contenir au moins 8 caractères." };
  }

  const user = await prisma.user.findUnique({
    where: { resetToken: token },
    select: { id: true, resetExpiry: true },
  });

  if (!user) return { success: false, error: "Lien invalide ou déjà utilisé." };
  if (!user.resetExpiry || user.resetExpiry < new Date()) {
    return { success: false, error: "Ce lien a expiré. Faites une nouvelle demande." };
  }

  const hashedPassword = await hash(motDePasse, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetExpiry: null,
    },
  });

  return { success: true };
}
