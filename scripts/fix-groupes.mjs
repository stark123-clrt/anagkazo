import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: "postgresql://postgres:Meli123christ%26@localhost:5433/evangile?schema=public",
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Trouver le programme de test
  const prog = await prisma.programme.findFirst({
    where: { titre: "Sortie Test Centre-Ville" },
  });

  if (!prog) { console.log("Programme non trouvé"); return; }

  const raw = prog.repartitionGroupes;
  const groupes = raw?.groupes ?? [];

  // Vérifier si les groupes utilisent "numero" au lieu de "groupe"
  const fixed = groupes.map((g, i) => ({
    groupe: g.groupe ?? g.numero ?? (i + 1),
    membres: g.membres ?? [],
  }));

  await prisma.programme.update({
    where: { id: prog.id },
    data: { repartitionGroupes: { groupes: fixed } },
  });

  console.log("✅ Programme mis à jour :", JSON.stringify({ groupes: fixed }, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
