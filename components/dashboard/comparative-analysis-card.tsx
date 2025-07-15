"use client";

import { useState, useMemo } from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { InventoryFormValues } from "@/lib/schemas/inventory";

interface ComparativeAnalysisCardProps {
  data: InventoryFormValues[];
}

export function ComparativeAnalysisCard({
  data,
}: ComparativeAnalysisCardProps) {
  const [comparisonType, setComparisonType] = useState<string>("yearly");
  const [metric, setMetric] = useState<string>("weight");
  const [chartType, setChartType] = useState<string>("line");

  const { chartData, growthData, insights } = useMemo(() => {
    if (!data.length) return { chartData: [], growthData: [], insights: null };

    let groupedData: Record<
      string,
      { count: number; weight: number; items: InventoryFormValues[] }
    > = {};
    let sortedKeys: string[] = [];

    // Group data based on comparison type
    switch (comparisonType) {
      case "yearly":
        data.forEach((item) => {
          const key = item.year || "Unknown";
          if (!groupedData[key]) {
            groupedData[key] = { count: 0, weight: 0, items: [] };
          }
          groupedData[key].count += 1;
          groupedData[key].weight += item.weight || 0;
          groupedData[key].items.push(item);
        });
        sortedKeys = Object.keys(groupedData).sort();
        break;

      case "seasonal":
        data.forEach((item) => {
          const key = `${item.year || "Unknown"}-${item.season || "unknown"}`;
          if (!groupedData[key]) {
            groupedData[key] = { count: 0, weight: 0, items: [] };
          }
          groupedData[key].count += 1;
          groupedData[key].weight += item.weight || 0;
          groupedData[key].items.push(item);
        });
        sortedKeys = Object.keys(groupedData).sort();
        break;

      case "type":
        data.forEach((item) => {
          const key = item.type || "Unknown";
          if (!groupedData[key]) {
            groupedData[key] = { count: 0, weight: 0, items: [] };
          }
          groupedData[key].count += 1;
          groupedData[key].weight += item.weight || 0;
          groupedData[key].items.push(item);
        });
        sortedKeys = Object.keys(groupedData).sort();
        break;

      case "location":
        data.forEach((item) => {
          const key = item.location_planted || "Unknown";
          if (!groupedData[key]) {
            groupedData[key] = { count: 0, weight: 0, items: [] };
          }
          groupedData[key].count += 1;
          groupedData[key].weight += item.weight || 0;
          groupedData[key].items.push(item);
        });
        sortedKeys = Object.keys(groupedData).sort();
        break;
    }

    // Prepare chart data
    const chartData = sortedKeys.map((key) => {
      const data = groupedData[key];
      return {
        period: key,
        count: data.count,
        weight: Number(data.weight.toFixed(2)),
        avgWeight:
          data.count > 0 ? Number((data.weight / data.count).toFixed(2)) : 0,
        totalItems: data.count,
      };
    });

    // Calculate growth data (only for time-based comparisons)
    const growthData =
      comparisonType === "yearly" || comparisonType === "seasonal"
        ? chartData.map((item, index) => {
            if (index === 0) return { ...item, growth: 0, weightGrowth: 0 };

            const prev = chartData[index - 1];
            const countGrowth =
              prev.count > 0
                ? ((item.count - prev.count) / prev.count) * 100
                : 0;
            const weightGrowth =
              prev.weight > 0
                ? ((item.weight - prev.weight) / prev.weight) * 100
                : 0;

            return {
              ...item,
              growth: Number(countGrowth.toFixed(1)),
              weightGrowth: Number(weightGrowth.toFixed(1)),
            };
          })
        : [];

    // Helper function to get metric value safely
    const getMetricValue = (item: (typeof chartData)[0]): number => {
      switch (metric) {
        case "count":
          return item.count;
        case "weight":
          return item.weight;
        case "avgWeight":
          return item.avgWeight;
        default:
          return item.weight;
      }
    };

    // Calculate insights
    const insights =
      chartData.length > 0
        ? {
            totalPeriods: sortedKeys.length,
            bestPeriod: chartData.reduce(
              (max, item) =>
                getMetricValue(item) > getMetricValue(max) ? item : max,
              chartData[0],
            ),
            worstPeriod: chartData.reduce(
              (min, item) =>
                getMetricValue(item) < getMetricValue(min) ? item : min,
              chartData[0],
            ),
            avgMetric: Number(
              (
                chartData.reduce((sum, item) => sum + getMetricValue(item), 0) /
                chartData.length
              ).toFixed(2),
            ),
            trend:
              growthData.length > 1
                ? growthData[growthData.length - 1][
                    metric === "weight" ? "weightGrowth" : "growth"
                  ] > 0
                  ? "increasing"
                  : "decreasing"
                : "stable",
          }
        : null;

    return { chartData, growthData, insights };
  }, [data, comparisonType, metric]);

  const getYAxisLabel = () => {
    switch (metric) {
      case "count":
        return "Number of Items";
      case "weight":
        return "Total Weight (kg)";
      case "avgWeight":
        return "Average Weight (kg)";
      default:
        return "Total Weight (kg)";
    }
  };

  const getXAxisLabel = () => {
    switch (comparisonType) {
      case "yearly":
        return "Year";
      case "seasonal":
        return "Year-Season";
      case "type":
        return "Type";
      case "location":
        return "Location";
      default:
        return "Period";
    }
  };

  const formatPeriod = (period: string) => {
    if (comparisonType === "seasonal") {
      return period.replace("-", " ");
    }
    return period;
  };

  return (
    <Card className="min-w-96">
      <CardHeader>
        <CardTitle>Comparative Analysis</CardTitle>
        <CardDescription>
          Compare trends and patterns across different dimensions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={comparisonType} onValueChange={setComparisonType}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Compare by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yearly">Year</SelectItem>
                <SelectItem value="seasonal">Season</SelectItem>
                <SelectItem value="type">Type</SelectItem>
                <SelectItem value="location">Location</SelectItem>
              </SelectContent>
            </Select>

            <Select value={metric} onValueChange={setMetric}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Metric" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weight">Total Weight</SelectItem>
                <SelectItem value="count">Item Count</SelectItem>
                <SelectItem value="avgWeight">Avg Weight</SelectItem>
              </SelectContent>
            </Select>

            <Select value={chartType} onValueChange={setChartType}>
              <SelectTrigger className="w-full sm:w-28">
                <SelectValue placeholder="Chart" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Line</SelectItem>
                <SelectItem value="bar">Bar</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Chart */}
          {chartData.length > 0 ? (
            <div className="h-64">
              <ChartContainer
                config={{
                  [metric]: {
                    label: getYAxisLabel(),
                    color: "#8884d8",
                  },
                }}
              >
                {chartType === "line" ? (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="period"
                      fontSize={12}
                      angle={comparisonType === "seasonal" ? -45 : 0}
                      textAnchor={
                        comparisonType === "seasonal" ? "end" : "middle"
                      }
                      height={comparisonType === "seasonal" ? 60 : 30}
                      tickFormatter={formatPeriod}
                    />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey={metric}
                      stroke="#8884d8"
                      strokeWidth={2}
                      dot={{ fill: "#8884d8", strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                ) : (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="period"
                      fontSize={12}
                      angle={comparisonType === "seasonal" ? -45 : 0}
                      textAnchor={
                        comparisonType === "seasonal" ? "end" : "middle"
                      }
                      height={comparisonType === "seasonal" ? 60 : 30}
                      tickFormatter={formatPeriod}
                    />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey={metric}
                      fill="#8884d8"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                )}
              </ChartContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No data available for comparison
            </div>
          )}

          {/* Insights */}
          {insights && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="bg-green-50 p-3 rounded">
                <div className="font-semibold text-green-900">Best Period</div>
                <div className="text-green-700">
                  {formatPeriod(insights.bestPeriod.period)}:{" "}
                  {(() => {
                    const value =
                      metric === "count"
                        ? insights.bestPeriod.count
                        : metric === "weight"
                          ? insights.bestPeriod.weight
                          : insights.bestPeriod.avgWeight;
                    return value.toFixed(2);
                  })()}{" "}
                  {metric === "count" ? "items" : "kg"}
                </div>
              </div>
              <div className="bg-blue-50 p-3 rounded">
                <div className="font-semibold text-blue-900">Average</div>
                <div className="text-blue-700">
                  {insights.avgMetric} {metric === "count" ? "items" : "kg"}
                </div>
              </div>
              <div className="bg-purple-50 p-3 rounded">
                <div className="font-semibold text-purple-900">Trend</div>
                <div className="text-purple-700 capitalize">
                  {insights.trend}
                  {growthData.length > 1 && (
                    <span className="ml-1">
                      (
                      {
                        growthData[growthData.length - 1][
                          metric === "weight" ? "weightGrowth" : "growth"
                        ]
                      }
                      %)
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
