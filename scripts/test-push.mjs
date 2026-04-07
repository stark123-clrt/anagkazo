import webpush from 'web-push';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  user: 'postgres',
  password: 'Meli123christ&',
  database: 'evangile',
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

webpush.setVapidDetails(
  'mailto:ondiyochristian10@gmail.com',
  'BH2uZDpgQX4wr8BLl7r-4zGooUoeOA2H6sdHOmwHq30aYh2j5lUuyadxjemUFYLLfLDkATTf1oBYaGmcA387Rw4',
  'A3zOB7jxgJe08V0LdcYgxFsCOIykodi9wqHgNpuSwX0',
);

async function main() {
  const subs = await prisma.pushSubscription.findMany();
  console.log(`📋 ${subs.length} abonnement(s) trouvé(s)`);

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title: '🔔 Test Anagkazo', body: 'Les notifications push fonctionnent !', url: '/' }),
      );
      console.log('✅ Notification envoyée !');
    } catch (err) {
      console.error('❌ Erreur:', err.message);
    }
  }
}

main().finally(() => prisma.$disconnect());
