"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import nodemailer from "nodemailer";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";

interface AjouterEvangelisteData {
  nom: string;
  email: string;
}

interface ActionResult {
  success: boolean;
  error?: string;
}

async function envoyerEmailInvitation(opts: {
  nomEvangeliste: string;
  emailEvangeliste: string;
  nomAdmin: string;
  nomOrg: string;
  lienActivation: string;
}) {
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

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:#020D1A;padding:32px 40px;text-align:center;">
              <p style="margin:0;color:#5750F1;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">FIJ Save Souls</p>
              <h1 style="margin:10px 0 0;color:#ffffff;font-size:20px;font-weight:700;">Invitation à rejoindre l'équipe</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 16px;color:#1a1a2e;font-size:15px;">Bonjour <strong>${opts.nomEvangeliste}</strong>,</p>

              <p style="margin:0 0 24px;color:#4a4a6a;font-size:14px;line-height:1.7;">
                <strong>${opts.nomAdmin}</strong> vous a invité à rejoindre l'équipe <strong>${opts.nomOrg}</strong>
                sur la plateforme FIJ Save Souls.
              </p>

              <p style="margin:0 0 24px;color:#4a4a6a;font-size:14px;line-height:1.7;">
                Cliquez sur le bouton ci-dessous pour créer votre mot de passe et accéder à votre espace.
              </p>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 32px;">
                    <a href="${opts.lienActivation}"
                       style="display:inline-block;background:#5750F1;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:14px 40px;border-radius:8px;">
                      Créer mon mot de passe
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Lien texte -->
              <p style="margin:0 0 8px;color:#4a4a6a;font-size:12px;">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :</p>
              <p style="margin:0 0 24px;word-break:break-all;">
                <a href="${opts.lienActivation}" style="color:#5750F1;font-size:12px;">${opts.lienActivation}</a>
              </p>

              <!-- Avertissement expiration -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#f8f8fc;border-left:3px solid #5750F1;border-radius:4px;padding:12px 16px;">
                    <p style="margin:0;color:#4a4a6a;font-size:12px;line-height:1.6;">
                      Ce lien est valable <strong>48 heures</strong>. Après expiration, demandez un nouvel envoi à votre administrateur.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid #eeeef5;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#9999bb;font-size:11px;line-height:1.6;">
                Cet email vous a été envoyé par ${opts.nomOrg} via FIJ Save Souls.<br/>
                Si vous n'attendiez pas cette invitation, ignorez simplement cet email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
    to: opts.emailEvangeliste,
    subject: `Invitation — ${opts.nomOrg}`,
    html,
  });
}

export async function ajouterEvangeliste(
  data: AjouterEvangelisteData,
): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "Non autorisé. Veuillez vous reconnecter." };
  }
  if (session.user.role !== "ADMIN") {
    return { success: false, error: "Accès refusé. Réservé aux administrateurs." };
  }

  const { nom, email } = data;
  if (!nom.trim() || !email.trim()) {
    return { success: false, error: "Le nom et l'email sont requis." };
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { success: false, error: "Cette adresse email est déjà utilisée." };
  }

  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { nom: true, organization: { select: { nom: true } } },
  });

  // Token unique valable 48h — le mot de passe sera défini par l'évangéliste
  const token = randomUUID();
  const expiry = new Date(Date.now() + 48 * 60 * 60 * 1000);

  // Mot de passe temporaire vide (sera remplacé à l'activation)
  const hashedTemp = await hash(token, 10);

  try {
    await prisma.user.create({
      data: {
        nom: nom.trim(),
        email: email.trim().toLowerCase(),
        password: hashedTemp,
        role: "EVANGELISTE",
        actif: false, // inactif jusqu'à activation
        organizationId: session.user.organizationId,
        invitationToken: token,
        invitationExpiry: expiry,
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const lienActivation = `${baseUrl}/invitation/${token}`;

    try {
      console.log("[MAIL] host:", process.env.MAIL_HOST, "user:", process.env.MAIL_USERNAME, "to:", email.trim().toLowerCase());
      await envoyerEmailInvitation({
        nomEvangeliste: nom.trim(),
        emailEvangeliste: email.trim().toLowerCase(),
        nomAdmin: admin?.nom ?? "L'administrateur",
        nomOrg: admin?.organization?.nom ?? "votre organisation",
        lienActivation,
      });
      console.log("[MAIL] ✅ Email envoyé à", email.trim().toLowerCase());
    } catch (mailErr) {
      console.error("[MAIL] ❌ Erreur envoi email:", mailErr);
    }

    revalidatePath("/equipe");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la création du compte. Veuillez réessayer." };
  }
}

export async function suspendreEvangeliste(userId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN")
    return { success: false, error: "Accès refusé." };
  if (userId === session.user.id)
    return { success: false, error: "Impossible de se suspendre soi-même." };

  const cible = await prisma.user.findUnique({ where: { id: userId }, select: { organizationId: true, role: true } });
  if (!cible || cible.organizationId !== session.user.organizationId)
    return { success: false, error: "Utilisateur introuvable." };
  if (cible.role === "ADMIN")
    return { success: false, error: "Impossible de suspendre un admin." };

  await prisma.user.update({ where: { id: userId }, data: { actif: false } });
  revalidatePath("/equipe");
  return { success: true };
}

export async function reactiverEvangeliste(userId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN")
    return { success: false, error: "Accès refusé." };

  const cible = await prisma.user.findUnique({ where: { id: userId }, select: { organizationId: true } });
  if (!cible || cible.organizationId !== session.user.organizationId)
    return { success: false, error: "Utilisateur introuvable." };

  await prisma.user.update({ where: { id: userId }, data: { actif: true } });
  revalidatePath("/equipe");
  return { success: true };
}

export async function supprimerEvangeliste(userId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN")
    return { success: false, error: "Accès refusé." };
  if (userId === session.user.id)
    return { success: false, error: "Impossible de se supprimer soi-même." };

  const cible = await prisma.user.findUnique({ where: { id: userId }, select: { organizationId: true, role: true, nom: true } });
  if (!cible || cible.organizationId !== session.user.organizationId)
    return { success: false, error: "Utilisateur introuvable." };
  if (cible.role === "ADMIN")
    return { success: false, error: "Impossible de supprimer un admin." };

  // Réassigner ses rencontres à l'admin avant suppression
  // On garde le nom de l'évangéliste dans groupeEquipe pour l'historique
  const rencontres = await prisma.rencontre.findMany({
    where: { evangelisteId: userId },
    select: { id: true, groupeEquipe: true },
  });

  for (const r of rencontres) {
    const equipe = r.groupeEquipe.length > 0 ? r.groupeEquipe : [cible.nom];
    await prisma.rencontre.update({
      where: { id: r.id },
      data: {
        evangelisteId: session.user.id,
        groupeEquipe: equipe.includes(cible.nom) ? equipe : [cible.nom, ...equipe],
      },
    });
  }

  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/equipe");
  return { success: true };
}
