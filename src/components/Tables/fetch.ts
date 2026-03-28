import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getTopProducts() {
  // Fake delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return [
    {
      image: "/images/product/product-01.png",
      name: "Apple Watch Series 7",
      category: "Electronics",
      price: 296,
      sold: 22,
      profit: 45,
    },
    {
      image: "/images/product/product-02.png",
      name: "Macbook Pro M1",
      category: "Electronics",
      price: 546,
      sold: 12,
      profit: 125,
    },
    {
      image: "/images/product/product-03.png",
      name: "Dell Inspiron 15",
      category: "Electronics",
      price: 443,
      sold: 64,
      profit: 247,
    },
    {
      image: "/images/product/product-04.png",
      name: "HP Probook 450",
      category: "Electronics",
      price: 499,
      sold: 72,
      profit: 103,
    },
  ];
}

export async function getInvoiceTableData() {
  // Fake delay
  await new Promise((resolve) => setTimeout(resolve, 1400));

  return [
    {
      name: "Free package",
      price: 0.0,
      date: "2023-01-13T18:00:00.000Z",
      status: "Paid",
    },
    {
      name: "Standard Package",
      price: 59.0,
      date: "2023-01-13T18:00:00.000Z",
      status: "Paid",
    },
    {
      name: "Business Package",
      price: 99.0,
      date: "2023-01-13T18:00:00.000Z",
      status: "Unpaid",
    },
    {
      name: "Standard Package",
      price: 59.0,
      date: "2023-01-13T18:00:00.000Z",
      status: "Pending",
    },
  ];
}

export async function getTopChannels() {
  const session = await auth();
  const orgId = session?.user?.organizationId;

  if (!orgId) return [];

  // Récupérer les 5 derniers programmes avec leurs rencontres agrégées
  const programmes = await prisma.programme.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      lieu: true,
      rencontres: {
        select: {
          priereSalut: true,
          guerison: true,
        },
      },
    },
  });

  return programmes.map((p) => {
    const ames = p.rencontres.length;
    const saluts = p.rencontres.filter((r) => r.priereSalut).length;
    const guerisons = p.rencontres.filter((r) => r.guerison).length;
    const taux = ames > 0 ? parseFloat(((saluts / ames) * 100).toFixed(1)) : 0;
    return {
      name: p.lieu,
      visitors: ames,
      revenues: saluts,
      sales: guerisons,
      conversion: taux,
    };
  });
}