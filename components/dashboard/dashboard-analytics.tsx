"use client";

import { PieChartCard } from "./pie-chart-card";
import { LowStockCard } from "./low-stock-card";
import { TimelineChart } from "./timeline-chart";
import { TotalWeightCard } from "./total-weight-card";
import type { InventoryFormValues } from "@/lib/schemas/inventory";

interface DashboardAnalyticsProps {
  data: InventoryFormValues[];
  selectedChart: string;
  onChartChange: (chart: string) => void;
  chartWeightMode: boolean;
  onWeightModeChange: (weightMode: boolean) => void;
}

export function DashboardAnalytics({
  data,
  selectedChart,
  onChartChange,
  chartWeightMode,
  onWeightModeChange,
}: DashboardAnalyticsProps) {
  return (
    <div className="mb-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Statistics</h2>
        <p className="text-gray-600">Statistics data for inventory</p>
      </div>

      <div className="flex flex-col md:flex-row flex-wrap gap-6 items-start justify-center">
        <div className="flex-shrink-0">
          <PieChartCard
            data={data}
            selectedChart={selectedChart}
            onChartChange={onChartChange}
            chartWeightMode={chartWeightMode}
            onWeightModeChange={onWeightModeChange}
          />
        </div>
        <div className="flex-shrink-0">
          <LowStockCard data={data} />
        </div>
        <div className="mt-6">
          <TimelineChart data={data} />
        </div>
        <TotalWeightCard data={data} />
      </div>
    </div>
  );
}
