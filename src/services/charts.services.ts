import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MOIS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

export async function getDevicesUsedData(
  timeFrame?: "monthly" | "yearly" | (string & {}),
) {
  const session = await auth();
  const orgId = session?.user?.organizationId;

  if (!orgId) {
    return [
      { name: "A besoin d'une église", percentage: 0, amount: 0 },
      { name: "Déjà planté", percentage: 0, amount: 0 },
      { name: "Ne veut pas de suivi", percentage: 0, amount: 0 },
    ];
  }

  const now = new Date();
  let dateFrom: Date;

  if (timeFrame === "yearly") {
    dateFrom = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  } else {
    dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const where = { organizationId: orgId, createdAt: { gte: dateFrom } };

  const [total, besoinEglise, dejaPlante, sansContact] = await Promise.all([
    prisma.rencontre.count({ where }),
    // Besoin église : salut=true ET besoinEglise=true
    prisma.rencontre.count({ where: { ...where, priereSalut: true, besoinEglise: true } }),
    // Déjà planté : salut=true ET besoinEglise=false (ou null)
    prisma.rencontre.count({ where: { ...where, priereSalut: true, besoinEglise: false } }),
    // Sans contact / pas de salut
    prisma.rencontre.count({ where: { ...where, priereSalut: false } }),
  ]);

  if (total === 0) {
    return [
      { name: "A besoin d'une église", percentage: 0, amount: 0 },
      { name: "Déjà planté", percentage: 0, amount: 0 },
      { name: "Ne veut pas de suivi", percentage: 0, amount: 0 },
    ];
  }

  return [
    {
      name: "A besoin d'une église",
      percentage: parseFloat((besoinEglise / total).toFixed(2)),
      amount: besoinEglise,
    },
    {
      name: "Déjà planté",
      percentage: parseFloat((dejaPlante / total).toFixed(2)),
      amount: dejaPlante,
    },
    {
      name: "Ne veut pas de suivi",
      percentage: parseFloat((sansContact / total).toFixed(2)),
      amount: sansContact,
    },
  ];
}

export async function getPaymentsOverviewData(
  timeFrame?: "monthly" | "yearly" | (string & {}),
) {
  const session = await auth();
  const orgId = session?.user?.organizationId;

  if (!orgId) {
    const empty = MOIS.map((m) => ({ x: m, y: 0 }));
    return { received: empty, due: [...empty] };
  }

  const currentYear = new Date().getFullYear();

  if (timeFrame === "yearly") {
    // 1 seule requête SQL — GROUP BY EXTRACT(year)
    type YearRow = { yr: number; ames: bigint; saluts: bigint };
    const rows = await prisma.$queryRaw<YearRow[]>`
      SELECT
        EXTRACT(year FROM "createdAt")::int AS yr,
        COUNT(*)::bigint                    AS ames,
        SUM(CASE WHEN "priereSalut" THEN 1 ELSE 0 END)::bigint AS saluts
      FROM "Rencontre"
      WHERE "organizationId" = ${orgId}
        AND EXTRACT(year FROM "createdAt") BETWEEN ${currentYear - 4} AND ${currentYear}
      GROUP BY yr
      ORDER BY yr
    `;

    const byYear = Object.fromEntries(rows.map((r) => [r.yr, r]));
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 4 + i);

    return {
      received: years.map((y) => ({ x: y, y: Number(byYear[y]?.ames ?? 0) })),
      due:      years.map((y) => ({ x: y, y: Number(byYear[y]?.saluts ?? 0) })),
    };
  }

  // Monthly : 1 seule requête SQL — GROUP BY DATE_TRUNC('month')
  type MonthRow = { mois: number; ames: bigint; saluts: bigint };
  const rows = await prisma.$queryRaw<MonthRow[]>`
    SELECT
      EXTRACT(month FROM "createdAt")::int AS mois,
      COUNT(*)::bigint                     AS ames,
      SUM(CASE WHEN "priereSalut" THEN 1 ELSE 0 END)::bigint AS saluts
    FROM "Rencontre"
    WHERE "organizationId" = ${orgId}
      AND EXTRACT(year FROM "createdAt") = ${currentYear}
    GROUP BY mois
    ORDER BY mois
  `;

  const byMois = Object.fromEntries(rows.map((r) => [r.mois, r]));

  return {
    received: MOIS.map((label, i) => ({ x: label, y: Number(byMois[i + 1]?.ames ?? 0) })),
    due:      MOIS.map((label, i) => ({ x: label, y: Number(byMois[i + 1]?.saluts ?? 0) })),
  };
}

export async function getWeeksProfitData(timeFrame?: string) {
  const session = await auth();
  const orgId = session?.user?.organizationId;

  if (!orgId) {
    const labels = ["Chrétiens", "Musulmans", "Athées", "Autres"];
    return {
      sales: labels.map((x) => ({ x, y: 0 })),
      revenue: labels.map((x) => ({ x, y: 0 })),
    };
  }

  const now = new Date();

  let dateFrom: Date;
  let dateTo: Date | undefined;

  if (timeFrame === "last week") {
    const startOfLastWeek = new Date(now);
    startOfLastWeek.setDate(now.getDate() - now.getDay() - 7);
    startOfLastWeek.setHours(0, 0, 0, 0);
    const endOfLastWeek = new Date(startOfLastWeek);
    endOfLastWeek.setDate(startOfLastWeek.getDate() + 7);
    dateFrom = startOfLastWeek;
    dateTo = endOfLastWeek;
  } else {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    dateFrom = startOfWeek;
  }

  const rows = await prisma.rencontre.findMany({
    where: {
      organizationId: orgId,
      createdAt: { gte: dateFrom, ...(dateTo ? { lt: dateTo } : {}) },
    },
    select: { religion: true, priereSalut: true },
  });

  return buildReligionData(rows);
}

function buildReligionData(rows: { religion: string; priereSalut: boolean }[]) {
  const KNOWN = ["Chrétiens", "Musulmans", "Athées"];
  const counts: Record<string, { total: number; saluts: number }> = {};

  for (const r of rows) {
    const label = KNOWN.includes(r.religion) ? r.religion : "Autres";
    if (!counts[label]) counts[label] = { total: 0, saluts: 0 };
    counts[label].total++;
    if (r.priereSalut) counts[label].saluts++;
  }

  const labels = [...KNOWN, "Autres"];
  return {
    sales: labels.map((x) => ({ x, y: counts[x]?.total ?? 0 })),
    revenue: labels.map((x) => ({ x, y: counts[x]?.saluts ?? 0 })),
  };
}

export async function getCampaignVisitorsData() {
  return {
    total_visitors: 0,
    performance: 0,
    chart: [
      { x: "S", y: 0 },
      { x: "S", y: 0 },
      { x: "M", y: 0 },
      { x: "T", y: 0 },
      { x: "W", y: 0 },
      { x: "T", y: 0 },
      { x: "F", y: 0 },
    ],
  };
}

export async function getVisitorsAnalyticsData() {
  return Array.from({ length: 30 }, (_, i) => ({ x: String(i + 1), y: 0 }));
}

export async function getCostsPerInteractionData() {
  return { avg_cost: 0, growth: 0, chart: [] };
}
