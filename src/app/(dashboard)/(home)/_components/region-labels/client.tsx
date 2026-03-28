"use client";

import dynamic from "next/dynamic";
import type { VilleData } from "./index";

const FranceChoropleth = dynamic(
  () => import("./FranceChoropleth").then((m) => ({ default: m.FranceChoropleth })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center text-sm text-dark-5 dark:text-dark-6">
        Chargement de la carte…
      </div>
    ),
  }
);

export function RegionLabelsClient({ villes }: { villes: VilleData[] }) {
  return <FranceChoropleth villes={villes} />;
}
