import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RegionLabelsClient } from "./client";

export type VilleData = {
  nom: string;
  coords: [number, number];
  ames: number;
  saluts: number;
  guerisons: number;
};

const COORDS_FR: Record<string, [number, number]> = {
  "Paris": [2.3522, 48.8566],
  "Lyon": [4.8357, 45.7640],
  "Marseille": [5.3698, 43.2965],
  "Toulouse": [1.4442, 43.6047],
  "Bordeaux": [-0.5792, 44.8378],
  "Nantes": [-1.5534, 47.2184],
  "Strasbourg": [7.7521, 48.5734],
  "Lille": [3.0573, 50.6292],
  "Rennes": [-1.6778, 48.1173],
  "Montpellier": [3.8767, 43.6119],
  "Nice": [7.2620, 43.7102],
  "Grenoble": [5.7245, 45.1885],
  "Toulon": [5.9281, 43.1242],
  "Dijon": [5.0415, 47.3220],
  "Angers": [-0.5532, 47.4784],
  "Brest": [-4.4852, 48.3904],
  "Le Havre": [0.1079, 49.4944],
  "Reims": [4.0317, 49.2583],
  "Saint-Étienne": [4.3872, 45.4397],
  "Rouen": [1.0993, 49.4432],
};

function findCoords(nom: string, fallback: [number, number]): [number, number] {
  const key = Object.keys(COORDS_FR).find(
    (k) =>
      nom.toLowerCase().includes(k.toLowerCase()) ||
      k.toLowerCase().includes(nom.toLowerCase())
  );
  return key ? COORDS_FR[key] : fallback;
}

export async function RegionLabels() {
  const session = await auth();
  const orgId = session?.user?.organizationId;

  let villes: VilleData[] = [];

  if (orgId) {
    const [rencontres, org] = await Promise.all([
      prisma.rencontre.findMany({
        where: { organizationId: orgId },
        select: { personneVille: true, latitude: true, longitude: true, priereSalut: true, guerison: true },
      }),
      prisma.organization.findUnique({
        where: { id: orgId },
        select: { ville: true, latitude: true, longitude: true },
      }),
    ]);

    // Un seul point sur la carte = la ville de la cellule
    // Toutes les rencontres (peu importe où habite l'âme) sont comptées ici
    const ames = rencontres.length;
    const saluts = rencontres.filter((r) => r.priereSalut).length;
    const guerisons = rencontres.filter((r) => r.guerison).length;

    if (org) {
      villes.push({
        nom: org.ville,
        coords: [org.longitude, org.latitude],
        ames,
        saluts,
        guerisons,
      });
    }
  }

  return (
    <div className="col-span-12 rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card xl:col-span-7">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-body-2xlg font-bold text-dark dark:text-white">
            Cartographie des Villes Touchées
          </h2>
          <p className="mt-0.5 text-sm text-dark-5 dark:text-dark-6">
            {villes.length > 0
              ? `${villes.length} ville${villes.length > 1 ? "s" : ""} suivie${villes.length > 1 ? "s" : ""}`
              : "Aucune ville enregistrée"}
          </p>
        </div>
        <span className="mt-1 shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          Vue nationale
        </span>
      </div>

      <RegionLabelsClient villes={villes} />
    </div>
  );
}
