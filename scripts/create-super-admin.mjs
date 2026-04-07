import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  user: 'postgres',
  password: 'Meli123christ&',
  database: 'evangile',
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const org = await prisma.organization.create({
    data: {
      nom: 'FIJ Châtelet',
      ville: 'Paris',
      latitude: 48.8603,
      longitude: 2.3477,
    },
  });

  const hash = await bcrypt.hash('Louci123nda&', 12);

  await prisma.user.upsert({
    where: { email: 'loucinda.desroches@gmail.com' },
    update: { role: 'SUPER_ADMIN', password: hash, organizationId: org.id },
    create: {
      nom: 'Loucinda',
      email: 'loucinda.desroches@gmail.com',
      password: hash,
      role: 'SUPER_ADMIN',
      organizationId: org.id,
    },
  });

  console.log('✅ Super admin créé !');
}

main().finally(() => prisma.$disconnect());
