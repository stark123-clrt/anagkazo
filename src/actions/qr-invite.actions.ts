"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import nodemailer from "nodemailer";

// ── Générer un nouveau token QR valable 35 secondes ──────────────
// Appelé toutes les 30s depuis le client — le token tourne en continu
export async function genererQRToken(): Promise<{
  token: string;
  lien: string;
  expiresAt: number; // timestamp ms
}> {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) throw new Error("Accès refusé");

  const token = randomUUID();
  const expiry = new Date(Date.now() + 35_000); // 35 secondes

  await prisma.organization.update({
    where: { id: session.user.organizationId },
    data: { qrInviteToken: token, qrInviteExpiry: expiry },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return {
    token,
    lien: `${baseUrl}/rejoindre/${token}`,
    expiresAt: expiry.getTime(),
  };
}

// ── Page /rejoindre : valider le token et récupérer l'org ────────
export async function validerTokenQR(token: string): Promise<{
  valid: boolean;
  orgNom?: string;
  orgId?: string;
  error?: string;
}> {
  const org = await prisma.organization.findUnique({
    where: { qrInviteToken: token },
    select: { id: true, nom: true, qrInviteExpiry: true },
  });

  if (!org) return { valid: false, error: "QR code invalide ou expiré." };
  if (!org.qrInviteExpiry || org.qrInviteExpiry < new Date()) {
    return { valid: false, error: "QR code expiré. Scannez le QR code affiché à l'écran." };
  }

  return { valid: true, orgNom: org.nom, orgId: org.id };
}

// ── Inscription via QR : créer compte + envoyer mail ─────────────
export async function inscrireViaQR(
  token: string,
  nom: string,
  email: string,
): Promise<{ success: boolean; error?: string }> {
  const validation = await validerTokenQR(token);
  if (!validation.valid) return { success: false, error: validation.error };

  const orgId = validation.orgId!;

  if (!nom.trim() || !email.trim()) return { success: false, error: "Nom et email requis." };

  const emailNorm = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: emailNorm } });
  if (existing) return { success: false, error: "Cette adresse email est déjà utilisée." };

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { nom: true },
  });

  const invitToken = randomUUID();
  const expiry = new Date(Date.now() + 48 * 60 * 60 * 1000);
  const { hash } = await import("bcryptjs");
  const hashedTemp = await hash(invitToken, 10);

  await prisma.user.create({
    data: {
      nom: nom.trim(),
      email: emailNorm,
      password: hashedTemp,
      role: "EVANGELISTE",
      actif: false,
      organizationId: orgId,
      invitationToken: invitToken,
      invitationExpiry: expiry,
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const lienActivation = `${baseUrl}/invitation/${invitToken}`;

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
      subject: `Invitation — ${org?.nom}`,
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
            <h1 style="margin:10px 0 0;color:#ffffff;font-size:20px;font-weight:700;">Invitation à rejoindre l'équipe</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 16px;color:#1a1a2e;font-size:15px;">Bonjour <strong>${nom.trim()}</strong>,</p>
            <p style="margin:0 0 24px;color:#4a4a6a;font-size:14px;line-height:1.7;">
              Vous avez rejoint l'équipe <strong>${org?.nom}</strong> sur Anagkazo.
              Cliquez sur le bouton ci-dessous pour créer votre mot de passe.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding:8px 0 32px;">
                  <a href="${lienActivation}" style="display:inline-block;background:#5750F1;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:14px 40px;border-radius:8px;">
                    Créer mon mot de passe
                  </a>
                </td>
              </tr>
            </table>
            <p style="color:#888;font-size:12px;">Ce lien expire dans 48h.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });
  } catch (e) {
    console.error("[QR INVITE] Erreur mail:", e);
  }

  return { success: true };
}
