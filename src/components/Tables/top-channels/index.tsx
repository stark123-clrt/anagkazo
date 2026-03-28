import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { compactFormat, standardFormat } from "@/lib/format-number";
import { cn } from "@/lib/utils";
import { getTopChannels } from "../fetch";

export async function TopChannels({ className }: { className?: string }) {
  const data = await getTopChannels();

  return (
    <div
      className={cn(
        "grid rounded-[10px] bg-white px-7.5 pb-4 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card",
        className,
      )}
    >
      <h2 className="mb-4 text-body-2xlg font-bold text-dark dark:text-white">
        Dernières Sorties d&apos;Évangélisation
      </h2>

      {data.length === 0 ? (
        <div className="py-10 text-center text-sm text-dark-5 dark:text-dark-6">
          <p>Aucune sortie enregistrée pour le moment.</p>
          <a href="/programmes/nouveau" className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">
            Créer un programme →
          </a>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="border-none uppercase">
              <TableHead className="min-w-[160px] text-left">Ville / Lieu</TableHead>
              <TableHead className="text-center">Âmes Touchées</TableHead>
              <TableHead className="text-center">Saluts</TableHead>
              <TableHead className="text-center">Guérisons</TableHead>
              <TableHead className="text-center">Taux Salut</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.map((channel, i) => (
              <TableRow
                className="text-base font-medium text-dark dark:text-white"
                key={channel.name + i}
              >
                <TableCell>
                  <div className="flex min-w-fit items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </div>
                    <span>{channel.name}</span>
                  </div>
                </TableCell>

                <TableCell className="text-center">{compactFormat(channel.visitors)}</TableCell>

                <TableCell className="text-center text-green">
                  {standardFormat(channel.revenues)}
                </TableCell>

                <TableCell className="text-center text-[#FF9C55]">{channel.sales}</TableCell>

                <TableCell className="text-center">{channel.conversion}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
