import { config } from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import nodemailer from "nodemailer";

// Charger le .env exactement comme Next.js le fait
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });

console.log("Variables lues depuis .env :");
console.log("  MAIL_HOST     :", process.env.MAIL_HOST);
console.log("  MAIL_PORT     :", process.env.MAIL_PORT);
console.log("  MAIL_USERNAME :", process.env.MAIL_USERNAME);
console.log("  MAIL_PASSWORD :", process.env.MAIL_PASSWORD);
console.log("  MAIL_FROM     :", process.env.MAIL_FROM_ADDRESS);

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

async function main() {
  console.log("\n📧 Test avec les variables .env (comme l'app)...");

  try {
    await transporter.verify();
    console.log("✅ Connexion SMTP OK");
  } catch (err) {
    console.error("❌ Erreur connexion :", err.message);
    process.exit(1);
  }

  try {
    const info = await transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
      to: "christianondiyo78@gmail.com",
      subject: "Test via .env — FIJ",
      html: "<p>Test envoyé avec les mêmes variables que l'application.</p>",
    });
    console.log("✅ Envoyé ! Message ID :", info.messageId);
  } catch (err) {
    console.error("❌ Erreur envoi :", err.message);
  }
}

main();
