"use client";

import { compactFormat } from "@/lib/format-number";
import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

type PropsType = {
  data: { name: string; amount: number }[];
};

const Chart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export function DonutChart({ data }: PropsType) {
  const total = data.reduce((s, d) => s + d.amount, 0);

  // Quand pas encore de données : afficher un état vide sans NaN
  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-10">
        <div className="flex size-24 items-center justify-center rounded-full bg-gray-1 dark:bg-dark-2">
          <span className="text-2xl font-bold text-dark-5 dark:text-dark-6">0</span>
        </div>
        <p className="text-sm text-dark-5 dark:text-dark-6">Aucune âme enregistrée ce mois</p>
      </div>
    );
  }

  const chartOptions: ApexOptions = {
    chart: {
      type: "donut",
      fontFamily: "inherit",
    },
    colors: ["#5750F1", "#5475E5", "#8099EC", "#ADBCF2"],
    labels: data.map((item) => item.name),
    legend: {
      show: true,
      position: "bottom",
      itemMargin: {
        horizontal: 10,
        vertical: 5,
      },
      formatter: (legendName, opts) => {
        const { seriesPercent } = opts.w.globals;
        const pct = Number(seriesPercent[opts.seriesIndex]).toFixed(1);
        return `${legendName}: ${pct}%`;
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: "80%",
          background: "transparent",
          labels: {
            show: true,
            total: {
              show: true,
              showAlways: true,
              label: "Âmes",
              fontSize: "16px",
              fontWeight: "400",
            },
            value: {
              show: true,
              fontSize: "28px",
              fontWeight: "bold",
              formatter: (val) => compactFormat(+val),
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    responsive: [
      {
        breakpoint: 2600,
        options: {
          chart: {
            width: 415,
          },
        },
      },
      {
        breakpoint: 640,
        options: {
          chart: {
            width: "100%",
          },
        },
      },
      {
        breakpoint: 370,
        options: {
          chart: {
            width: 260,
          },
        },
      },
    ],
  };

  return (
    <Chart
      options={chartOptions}
      series={data.map((item) => item.amount)}
      type="donut"
    />
  );
}
