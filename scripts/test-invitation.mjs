import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "mail.anagkazo-soul.fr",
  port: 587,
  secure: false,
  tls: { rejectUnauthorized: false },
  auth: {
    user: "contact@anagkazo-soul.fr",
    pass: "Anagkazo123soul&",
  },
});

const fakeToken = "test-token-123";
const lienActivation = `http://localhost:3000/invitation/${fakeToken}`;

const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="background:#020D1A;padding:32px 40px;text-align:center;">
            <p style="margin:0;color:#5750F1;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">FIJ Save Souls</p>
            <h1 style="margin:10px 0 0;color:#ffffff;font-size:20px;font-weight:700;">Invitation à rejoindre l'équipe</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 16px;color:#1a1a2e;font-size:15px;">Bonjour <strong>Christian (Test)</strong>,</p>
            <p style="margin:0 0 24px;color:#4a4a6a;font-size:14px;line-height:1.7;">
              Ceci est un test du mail d'invitation. Cliquez sur le bouton pour vérifier que le lien fonctionne.
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
            <p style="color:#888;font-size:12px;">FIJ — Fraternité Internationale de Jésus</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

async function main() {
  console.log("📧 Test email d'invitation...");

  try {
    const info = await transporter.sendMail({
      from: '"FIJ EVANGILE" <contact@anagkazo-soul.fr>',
      to: "ondiyochristian10@gmail.com",
      subject: "Test — Invitation FIJ Save Souls",
      html,
    });
    console.log("✅ Email d'invitation envoyé !");
    console.log("   Message ID :", info.messageId);
  } catch (err) {
    console.error("❌ Erreur :", err.message);
  }
}

main();
