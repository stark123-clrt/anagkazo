export const dynamic = "force-dynamic";
import { PaymentsOverview } from "@/components/Charts/payments-overview";
import { UsedDevices } from "@/components/Charts/used-devices";
import { WeeksProfit } from "@/components/Charts/weeks-profit";
import { TopChannels } from "@/components/Tables/top-channels";
import { TopChannelsSkeleton } from "@/components/Tables/top-channels/skeleton";
import { createTimeFrameExtractor } from "@/utils/timeframe-extractor";
import { Suspense } from "react";
import { ChatsCard } from "./_components/chats-card";
import { OverviewCardsGroup } from "./_components/overview-cards";
import { OverviewCardsSkeleton } from "./_components/overview-cards/skeleton";
import { RegionLabels } from "./_components/region-labels";
import { getDernieresRencontres, getOverviewData } from "./fetch";

type PropsType = {
  searchParams: Promise<{ selected_time_frame?: string }>;
};

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function Home({ searchParams }: PropsType) {
  const { selected_time_frame } = await searchParams;
  const extractTimeFrame = createTimeFrameExtractor(selected_time_frame);

  // Données réelles depuis Prisma
  const [stats, dernieresRencontres] = await Promise.all([
    getOverviewData(),
    getDernieresRencontres(),
  ]);

  return (
    <>
      {/* ===== KPI CARDS — vraies données ===== */}
      <Suspense fallback={<OverviewCardsSkeleton />}>
        <OverviewCardsGroup
          totalAmes={stats.totalAmes}
          totalSaluts={stats.totalSaluts}
          totalPrieres={stats.totalPrieres}
          totalGuerisons={stats.totalGuerisons}
        />
      </Suspense>

      {/* ===== DERNIÈRES RENCONTRES ===== */}
      <div className="mt-4 rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card md:mt-6">
        <div className="flex items-center justify-between border-b border-stroke px-5 py-4 dark:border-dark-3">
          <h3 className="font-bold text-dark dark:text-white">Dernières Âmes Abordées</h3>
          <a href="/ames" className="text-xs font-semibold text-primary hover:underline">
            Voir tout →
          </a>
        </div>

        {dernieresRencontres.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-dark-5 dark:text-dark-6">
              Aucune rencontre enregistrée pour le moment.
            </p>
            <a href="/evangeliste/terrain" className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">
              Enregistrer une rencontre →
            </a>
          </div>
        ) : (
          <>
            {/* Mobile : cartes */}
            <div className="divide-y divide-stroke dark:divide-dark-3 sm:hidden">
              {dernieresRencontres.map((r) => (
                <div key={r.id} className="px-5 py-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {r.personneNom.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-dark dark:text-white">{r.personneNom}</p>
                        <p className="text-xs text-dark-5 dark:text-dark-6">{r.personneVille} · {r.religion}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {r.priereSalut && <span className="rounded-full bg-green/10 px-2 py-0.5 text-[10px] font-bold text-green">Salut</span>}
                      {r.guerison && <span className="rounded-full bg-[#FF9C55]/10 px-2 py-0.5 text-[10px] font-bold text-[#FF9C55]">Guérison</span>}
                      {!r.priereSalut && !r.guerison && r.priereSpontanee && <span className="rounded-full bg-[#8155FF]/10 px-2 py-0.5 text-[10px] font-bold text-[#8155FF]">Prière</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop : tableau */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stroke bg-gray-1/50 dark:border-dark-3 dark:bg-dark-2/30">
                    {["Personne", "Ville", "Religion", "Statut", "Évangéliste", "Date"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-dark-5 dark:text-dark-6">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stroke dark:divide-dark-3">
                  {dernieresRencontres.map((r) => (
                    <tr key={r.id} className="transition hover:bg-gray-1/50 dark:hover:bg-dark-2/30">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {r.personneNom.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </div>
                          <span className="font-semibold text-dark dark:text-white">{r.personneNom}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-dark-5 dark:text-dark-6">{r.personneVille}</td>
                      <td className="px-5 py-3.5 text-dark-5 dark:text-dark-6">{r.religion}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {r.priereSalut && <span className="rounded-full bg-green/10 px-2 py-0.5 text-xs font-bold text-green">Salut</span>}
                          {r.guerison && <span className="rounded-full bg-[#FF9C55]/10 px-2 py-0.5 text-xs font-bold text-[#FF9C55]">Guérison</span>}
                          {r.priereSpontanee && <span className="rounded-full bg-[#8155FF]/10 px-2 py-0.5 text-xs font-bold text-[#8155FF]">Prière</span>}
                          {!r.priereSalut && !r.guerison && !r.priereSpontanee && (
                            <span className="rounded-full bg-gray-1 px-2 py-0.5 text-xs text-dark-5 dark:bg-dark-2 dark:text-dark-6">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="rounded-full bg-gray-1 px-2.5 py-0.5 text-xs font-medium text-dark dark:bg-dark-2 dark:text-white">
                          {r.evangeliste.nom}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-dark-5 dark:text-dark-6">
                        {formatDate(r.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ===== GRAPHIQUES & WIDGETS ===== */}
      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-9 2xl:gap-7.5">
        <PaymentsOverview
          className="col-span-12 xl:col-span-7"
          key={extractTimeFrame("payments_overview")}
          timeFrame={extractTimeFrame("payments_overview")?.split(":")[1]}
        />

        <WeeksProfit
          key={extractTimeFrame("weeks_profit")}
          timeFrame={extractTimeFrame("weeks_profit")?.split(":")[1]}
          className="col-span-12 xl:col-span-5"
        />

        <UsedDevices
          className="col-span-12 xl:col-span-5"
          key={extractTimeFrame("used_devices")}
          timeFrame={extractTimeFrame("used_devices")?.split(":")[1]}
        />

        <RegionLabels />

        <div className="col-span-12 grid xl:col-span-8">
          <Suspense fallback={<TopChannelsSkeleton />}>
            <TopChannels />
          </Suspense>
        </div>

        <Suspense fallback={null}>
          <ChatsCard />
        </Suspense>
      </div>
    </>
  );
}
