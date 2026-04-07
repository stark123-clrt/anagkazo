"use client";

import { useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";

// GeoJSON contour France entier (sans divisions internes)
const GEO_URL =
  "https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/regions.geojson";

interface VilleData {
  nom: string;
  coords: [number, number];
  ames: number;
  saluts: number;
  guerisons: number;
  isCurrent?: boolean;
}

interface TooltipData extends VilleData {
  x: number;
  y: number;
  isCurrent?: boolean;
}

// Rayon du cercle : min 6, max 22 (proportionnel aux âmes)
function getRadius(ames: number, maxAmes: number): number {
  if (maxAmes === 0) return 8;
  return 6 + (ames / maxAmes) * 16;
}

export function FranceChoropleth({ villes }: { villes: VilleData[] }) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const maxAmes = villes.length > 0 ? Math.max(...villes.map((v) => v.ames)) : 1;

  return (
    <div className="relative">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ center: [2.5, 46.5], scale: 2600 }}
        width={700}
        height={520}
        style={{ width: "100%", height: "auto" }}
      >
        <ZoomableGroup zoom={1} minZoom={0.8} maxZoom={4}>
          {/* Fond : régions toutes de la même couleur sombre */}
          <Geographies geography={GEO_URL}>
            {({ geographies }: { geographies: Array<{ rsmKey: string }> }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#1C2A3A"
                  stroke="#2E4057"
                  strokeWidth={0.8}
                  style={{
                    default: { outline: "none" },
                    hover:   { outline: "none", fill: "#243447" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {/* Marqueurs villes */}
          {villes.map((ville, index) => {
            const r = getRadius(ville.ames, maxAmes);
            const color = ville.isCurrent ? "#F5A623" : "#3C50E0";
            const stroke = ville.isCurrent ? "#FFD580" : "#7B96FF";
            return (
              <Marker
                key={`${ville.nom}-${index}`}
                coordinates={ville.coords}
                onMouseEnter={(evt: React.MouseEvent) => {
                  setTooltip({
                    nom: ville.nom,
                    ames: ville.ames,
                    saluts: ville.saluts,
                    guerisons: ville.guerisons,
                    isCurrent: ville.isCurrent,
                    x: evt.clientX,
                    y: evt.clientY,
                  });
                }}
                onMouseMove={(evt: React.MouseEvent) => {
                  setTooltip((prev) =>
                    prev ? { ...prev, x: evt.clientX, y: evt.clientY } : prev
                  );
                }}
                onMouseLeave={() => setTooltip(null)}
              >
                {/* Halo */}
                <circle r={r + 6} fill={color} opacity={0.18} />
                {/* Cercle principal */}
                <circle
                  r={r}
                  fill={color}
                  stroke={stroke}
                  strokeWidth={1.5}
                  opacity={0.9}
                  style={{ cursor: "pointer" }}
                />
                {/* Point central blanc */}
                <circle r={2.5} fill="#FFFFFF" opacity={0.9} />
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>

      {/* Légende taille — uniquement si plusieurs niveaux distincts */}
      {villes.length > 0 && maxAmes > 1 && (
        <div className="mt-2 flex items-center gap-4 px-2">
          <span className="text-xs text-dark-5 dark:text-dark-6">Taille = âmes touchées</span>
          <div className="flex items-center gap-3">
            {[Math.ceil(maxAmes * 0.2), Math.ceil(maxAmes * 0.6), maxAmes]
              .filter((v, i, arr) => arr.indexOf(v) === i) // déduplique
              .map((v, idx) => {
                const r = getRadius(v, maxAmes);
                return (
                  <div key={idx} className="flex items-center gap-1.5">
                    <svg width={r * 2 + 4} height={r * 2 + 4}>
                      <circle cx={(r * 2 + 4) / 2} cy={(r * 2 + 4) / 2} r={r} fill="#3C50E0" opacity={0.85} />
                    </svg>
                    <span className="text-xs text-dark-5 dark:text-dark-6">{v}</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Tooltip */}
      {tooltip && <TooltipCard tooltip={tooltip} />}
    </div>
  );
}

function TooltipCard({ tooltip }: { tooltip: TooltipData }) {
  return (
    <div
      className="pointer-events-none fixed z-50 min-w-[210px] rounded-xl border border-stroke bg-white p-3 shadow-2 dark:border-dark-3 dark:bg-gray-dark"
      style={{
        left: tooltip.x + 16,
        top: tooltip.y,
        transform: "translateY(-50%)",
      }}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="size-2.5 rounded-full" style={{ backgroundColor: tooltip.isCurrent ? "#F5A623" : "#3C50E0" }} />
        <p className="font-bold text-dark dark:text-white">{tooltip.nom}</p>
        {tooltip.isCurrent && <span className="rounded-full bg-[#F5A623]/15 px-2 py-0.5 text-[10px] font-bold text-[#F5A623]">Ma cellule</span>}
      </div>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between gap-6">
          <span className="text-dark-5 dark:text-dark-6">Âmes touchées</span>
          <span className="font-bold text-primary">{tooltip.ames}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-dark-5 dark:text-dark-6">Saluts</span>
          <span className="font-bold text-green">{tooltip.saluts}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-dark-5 dark:text-dark-6">Guérisons</span>
          <span className="font-bold text-[#FF9C55]">{tooltip.guerisons}</span>
        </div>
      </div>
    </div>
  );
}
