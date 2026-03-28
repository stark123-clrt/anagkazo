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

async function main() {
  console.log("📧 Test de connexion SMTP...");

  try {
    await transporter.verify();
    console.log("✅ Connexion SMTP OK");
  } catch (err) {
    console.error("❌ Erreur de connexion SMTP :", err.message);
    process.exit(1);
  }

  console.log("📤 Envoi de l'email de test...");

  try {
    const info = await transporter.sendMail({
      from: '"FIJ EVANGILE" <contact@anagkazo-soul.fr>',
      to: "christianondiyo78@gmail.com",
      subject: "Test mail",
      html: `<p>Test mail</p>`,
    });

    console.log("✅ Email envoyé avec succès !");
    console.log("   Message ID :", info.messageId);
    console.log("   Destinataire : christianondiyo78@gmail.com");
  } catch (err) {
    console.error("❌ Erreur d'envoi :", err.message);
  }
}

main();
