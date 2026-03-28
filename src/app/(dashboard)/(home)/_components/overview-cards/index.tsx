import { compactFormat } from "@/lib/format-number";
import { OverviewCard } from "./card";
import * as icons from "./icons";

type Props = {
  totalAmes: number;
  totalSaluts: number;
  totalPrieres: number;
  totalGuerisons: number;
};

export function OverviewCardsGroup({ totalAmes, totalSaluts, totalPrieres, totalGuerisons }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4 2xl:gap-7.5">
      <OverviewCard
        label="Âmes Abordées"
        data={{ value: compactFormat(totalAmes), growthRate: 0 }}
        Icon={icons.Views}
      />
      <OverviewCard
        label="Prières du Salut"
        data={{ value: compactFormat(totalSaluts), growthRate: 0 }}
        Icon={icons.Salvation}
      />
      <OverviewCard
        label="Prières Spontanées"
        data={{ value: compactFormat(totalPrieres), growthRate: 0 }}
        Icon={icons.Prayer}
      />
      <OverviewCard
        label="Guérisons"
        data={{ value: compactFormat(totalGuerisons), growthRate: 0 }}
        Icon={icons.Healing}
      />
    </div>
  );
}
