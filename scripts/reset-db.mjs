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

async function main() {
  console.log('🗑️  Suppression de toutes les données...');

  await prisma.rencontre.deleteMany();
  await prisma.programme.deleteMany();
  await prisma.invitationAdmin.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  console.log('✅ Base de données vidée !');
}

main().finally(() => prisma.$disconnect());
