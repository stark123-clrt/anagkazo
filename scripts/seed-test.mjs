import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({
  connectionString: "postgresql://postgres:Meli123christ%26@localhost:5433/evangile?schema=public",
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Trouver le compte admin existant
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    include: { organization: true },
  });

  if (!admin) {
    console.error("❌ Aucun admin trouvé dans la base.");
    return;
  }

  console.log(`✅ Admin trouvé : ${admin.nom} (${admin.email})`);
  console.log(`   Organisation : ${admin.organization.nom} (${admin.organizationId})`);

  const orgId = admin.organizationId;
  const hashedPwd = await bcrypt.hash("Test1234!", 10);

  // 2. Créer 7 évangélistes
  const prenomsEvangs = [
    "Samuel Dupont",
    "Marie Leclerc",
    "David Nkosi",
    "Esther Martin",
    "Jonathan Borel",
    "Grace Diallo",
    "Paul Moreau",
  ];

  const evangelistes = [];
  for (const nom of prenomsEvangs) {
    const email = `${nom.toLowerCase().replace(/ /g, ".").normalize("NFD").replace(/[\u0300-\u036f]/g, "")}@fij-test.fr`;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log(`  ↩ Évangéliste déjà existant : ${nom}`);
      evangelistes.push(existing);
    } else {
      const ev = await prisma.user.create({
        data: { nom, email, password: hashedPwd, role: "EVANGELISTE", organizationId: orgId },
      });
      console.log(`  ✓ Évangéliste créé : ${nom}`);
      evangelistes.push(ev);
    }
  }

  // 3. Créer un programme de test
  const progExistant = await prisma.programme.findFirst({
    where: { organizationId: orgId, titre: "Sortie Test Centre-Ville" },
  });
  const programme = progExistant ?? await prisma.programme.create({
    data: {
      titre: "Sortie Test Centre-Ville",
      lieu: "Place de la République",
      date: new Date(),
      statut: "termine",
      repartitionGroupes: {
        groupes: [
          { groupe: 1, membres: evangelistes.slice(0, 3).map((e) => e.id) },
          { groupe: 2, membres: evangelistes.slice(3, 6).map((e) => e.id) },
        ],
      },
      organizationId: orgId,
    },
  });
  console.log(`\n✅ Programme : ${programme.titre}`);

  // 4. Données de test — 25 âmes
  const amesData = [
    // --- HIER (1 âme) ---
    {
      nom: "Antoine Renard", ville: "Paris", religion: "Athée / Agnostique",
      salut: false, guerison: false, priereSpontanee: true, besoinEglise: true,
      contact: "06 11 22 33 44", evangelisteIdx: 0, hier: true,
    },
    // --- AUJOURD'HUI (24 âmes) ---
    { nom: "Fatou Dieng", ville: "Paris", religion: "Musulman(e)", salut: true, guerison: false, priereSpontanee: false, besoinEglise: true, contact: "07 11 22 33 55", evangelisteIdx: 1 },
    { nom: "Lucas Bernard", ville: "Lyon", religion: "Chrétien(ne)", salut: true, guerison: true, priereSpontanee: true, besoinEglise: false, contact: "06 22 33 44 55", evangelisteIdx: 2 },
    { nom: "Amina Koné", ville: "Marseille", religion: "Musulman(e)", salut: false, guerison: false, priereSpontanee: false, besoinEglise: false, contact: "", evangelisteIdx: 0 },
    { nom: "Pierre Lemaire", ville: "Bordeaux", religion: "Athée / Agnostique", salut: true, guerison: false, priereSpontanee: false, besoinEglise: true, contact: "06 33 44 55 66", evangelisteIdx: 3 },
    { nom: "Nadia Tremblay", ville: "Lille", religion: "Autre", salut: false, guerison: true, priereSpontanee: false, besoinEglise: false, contact: "", evangelisteIdx: 4 },
    { nom: "Kevin Morin", ville: "Toulouse", religion: "Chrétien(ne)", salut: true, guerison: true, priereSpontanee: true, besoinEglise: true, contact: "07 44 55 66 77", evangelisteIdx: 5 },
    { nom: "Isabelle Petit", ville: "Nantes", religion: "Athée / Agnostique", salut: false, guerison: false, priereSpontanee: true, besoinEglise: false, contact: "", evangelisteIdx: 6 },
    { nom: "Moussa Bah", ville: "Strasbourg", religion: "Musulman(e)", salut: true, guerison: false, priereSpontanee: false, besoinEglise: true, contact: "06 55 66 77 88", evangelisteIdx: 1 },
    { nom: "Claire Fontaine", ville: "Rennes", religion: "Chrétien(ne)", salut: false, guerison: false, priereSpontanee: false, besoinEglise: false, contact: "", evangelisteIdx: 2 },
    { nom: "Théo Lambert", ville: "Paris", religion: "Autre", salut: true, guerison: false, priereSpontanee: true, besoinEglise: false, contact: "07 66 77 88 99", evangelisteIdx: 3 },
    { nom: "Aissatou Baldé", ville: "Lyon", religion: "Musulman(e)", salut: false, guerison: true, priereSpontanee: false, besoinEglise: true, contact: "", evangelisteIdx: 4 },
    { nom: "Romain Chevalier", ville: "Montpellier", religion: "Athée / Agnostique", salut: true, guerison: false, priereSpontanee: false, besoinEglise: false, contact: "06 77 88 99 00", evangelisteIdx: 5 },
    { nom: "Sofia El Amrani", ville: "Paris", religion: "Musulman(e)", salut: false, guerison: false, priereSpontanee: true, besoinEglise: false, contact: "", evangelisteIdx: 6 },
    { nom: "Nicolas Garnier", ville: "Nice", religion: "Chrétien(ne)", salut: true, guerison: true, priereSpontanee: false, besoinEglise: true, contact: "07 88 99 00 11", evangelisteIdx: 0 },
    { nom: "Mariama Sow", ville: "Toulouse", religion: "Autre", salut: false, guerison: false, priereSpontanee: false, besoinEglise: false, contact: "", evangelisteIdx: 1 },
    { nom: "Hugo Rousseau", ville: "Bordeaux", religion: "Athée / Agnostique", salut: true, guerison: false, priereSpontanee: true, besoinEglise: true, contact: "06 99 00 11 22", evangelisteIdx: 2 },
    { nom: "Diane Lefebvre", ville: "Rennes", religion: "Chrétien(ne)", salut: false, guerison: true, priereSpontanee: false, besoinEglise: false, contact: "", evangelisteIdx: 3 },
    { nom: "Ibrahim Camara", ville: "Paris", religion: "Musulman(e)", salut: true, guerison: false, priereSpontanee: false, besoinEglise: true, contact: "07 00 11 22 33", evangelisteIdx: 4 },
    { nom: "Lucie Simon", ville: "Marseille", religion: "Autre", salut: false, guerison: false, priereSpontanee: true, besoinEglise: false, contact: "", evangelisteIdx: 5 },
    { nom: "Baptiste Colin", ville: "Lyon", religion: "Chrétien(ne)", salut: true, guerison: true, priereSpontanee: true, besoinEglise: true, contact: "06 11 00 22 33", evangelisteIdx: 6 },
    { nom: "Khadija Touré", ville: "Strasbourg", religion: "Musulman(e)", salut: false, guerison: false, priereSpontanee: false, besoinEglise: false, contact: "", evangelisteIdx: 0 },
    { nom: "Alexandre Mercier", ville: "Nantes", religion: "Athée / Agnostique", salut: true, guerison: false, priereSpontanee: false, besoinEglise: true, contact: "07 22 33 44 00", evangelisteIdx: 1 },
    { nom: "Céline Nguyen", ville: "Paris", religion: "Autre", salut: false, guerison: true, priereSpontanee: true, besoinEglise: false, contact: "", evangelisteIdx: 2 },
    { nom: "Omar Diallo", ville: "Lille", religion: "Musulman(e)", salut: true, guerison: false, priereSpontanee: false, besoinEglise: true, contact: "06 33 00 55 77", evangelisteIdx: 3 },
  ];

  const hier = new Date();
  hier.setDate(hier.getDate() - 1);
  hier.setHours(14, 30, 0, 0);

  let created = 0;
  for (const a of amesData) {
    const ev = evangelistes[a.evangelisteIdx];
    const groupe = programme.repartitionGroupes?.groupes?.find((g) =>
      g.membres?.includes(ev.id)
    );
    await prisma.rencontre.create({
      data: {
        personneNom: a.nom,
        personneVille: a.ville,
        religion: a.religion,
        priereSalut: a.salut,
        guerison: a.guerison,
        priereSpontanee: a.priereSpontanee,
        besoinEglise: a.besoinEglise,
        contact: a.contact || null,
        groupeEquipe: groupe ? evangelistes.filter((e) => groupe.membres.includes(e.id)).map((e) => e.nom) : [ev.nom],
        evangelisteId: ev.id,
        organizationId: orgId,
        programmeId: programme.id,
        createdAt: a.hier ? hier : new Date(),
      },
    });
    created++;
    console.log(`  ✓ ${a.hier ? "[HIER]" : "[AUJOURD'HUI]"} ${a.nom} — salut:${a.salut ? "oui" : "non"} — par ${ev.nom}`);
  }

  console.log(`\n🎉 Terminé ! ${created} âmes créées, 7 évangélistes, 1 programme.`);

  // Résumé
  const stats = await prisma.rencontre.aggregate({
    where: { organizationId: orgId },
    _count: { id: true },
  });
  const saluts = await prisma.rencontre.count({ where: { organizationId: orgId, priereSalut: true } });
  console.log(`\n📊 Total dans la base : ${stats._count.id} âmes, ${saluts} saluts`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
