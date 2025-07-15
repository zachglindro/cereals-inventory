"use client";

import { useState, useEffect, useMemo } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DataTable } from "@/components/data-table/index";
import { columns } from "@/lib/schemas/columns";
import type { InventoryFormValues } from "@/lib/schemas/inventory";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
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

export default function Home() {
  const [data, setData] = useState<InventoryFormValues[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChart, setSelectedChart] = useState<string>("type");
  const [chartWeightMode, setChartWeightMode] = useState<boolean>(false);
  const tableColumns = columns as ColumnDef<InventoryFormValues, unknown>[];

  // Chart options for dropdown
  const chartOptions = [
    {
      value: "type",
      label: "Type",
      description: "Distribution by cereal type",
    },
    {
      value: "location_planted",
      label: "Planted",
      description: "Distribution by planting location",
    },
    { value: "year", label: "Year", description: "Distribution by year" },
    { value: "season", label: "Season", description: "Distribution by season" },
    {
      value: "location",
      label: "Location",
      description: "Distribution by storage location",
    },
    {
      value: "description",
      label: "Description",
      description: "Distribution by description",
    },
    {
      value: "pedigree",
      label: "Pedigree",
      description: "Distribution by pedigree",
    },
  ];

  // Color palettes for charts
  const colors = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff7c7c",
    "#8dd1e1",
    "#d084d0",
    "#ffb347",
    "#87ceeb",
    "#deb887",
    "#f0e68c",
    "#ff6347",
    "#40e0d0",
    "#ee82ee",
    "#90ee90",
    "#ffa07a",
  ];

  // Chart data calculations
  const chartData = useMemo(() => {
    if (!data.length) return {};

    // Helper function to create chart data from field counts
    const createChartData = (field: keyof InventoryFormValues) => {
      const counts: Record<string, number> = {};
      const weights: Record<string, number> = {};

      data.forEach((item) => {
        const value = String(item[field] || "Unknown");
        counts[value] = (counts[value] || 0) + 1;
        weights[value] = (weights[value] || 0) + (item.weight || 0);
      });

      const dataToUse = chartWeightMode ? weights : counts;

      return Object.entries(dataToUse).map(([name, value], index) => ({
        name,
        value,
        fill: colors[index % colors.length],
      }));
    };

    return {
      type: createChartData("type"),
      location_planted: createChartData("location_planted"),
      year: createChartData("year"),
      season: createChartData("season"),
      location: createChartData("location"),
      description: createChartData("description"),
      pedigree: createChartData("pedigree"),
    };
  }, [data, chartWeightMode]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const snapshot = await getDocs(collection(db, "inventory"));
      const rows = snapshot.docs.map((doc) => {
        return {
          ...(doc.data() as InventoryFormValues),
          id: doc.id,
        };
      });
      // Sort by box_number field
      const sortedRows = rows.sort((a, b) => {
        return Number(a.box_number ?? 0) - Number(b.box_number ?? 0);
      });
      setData(sortedRows);
      setLoading(false);
    }

    fetchData();
  }, []);

  // Chart component
  const PieChartCard = ({
    title,
    data: chartDataField,
    description,
  }: {
    title: string;
    data: Array<{ name: string; value: number; fill: string }>;
    description: string;
  }) => (
    <div className="w-100">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div>
                <Select value={selectedChart} onValueChange={setSelectedChart}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select chart" />
                  </SelectTrigger>
                  <SelectContent>
                    {chartOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select
                  value={chartWeightMode ? "weight" : "count"}
                  onValueChange={(value) =>
                    setChartWeightMode(value === "weight")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="count"># of entries</SelectItem>
                    <SelectItem value="weight">Weight (kg)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={chartDataField.reduce(
              (acc, item) => ({
                ...acc,
                [item.name]: { label: item.name, color: item.fill },
              }),
              {},
            )}
          >
            <PieChart>
              <Pie
                data={chartDataField}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                }
                outerRadius="80%"
                fill="#8884d8"
                dataKey="value"
              >
                {chartDataField.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip
                content={<ChartTooltipContent />}
                formatter={(value) => [
                  `${value}${chartWeightMode ? " kg" : " entries"}`,
                  chartWeightMode ? "Weight" : "Count",
                ]}
              />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );

  // Low Stock Analytics Card
  const LowStockCard = () => {
    // All low stock state is now local to this component
    const [lowStockThreshold, setLowStockThreshold] = useState<number>(2);
    const [lowStockSortBy, setLowStockSortBy] = useState<string>("weight");
    const [lowStockDisplayCount, setLowStockDisplayCount] = useState<number>(5);

    // Calculate low stock items inside the component to avoid affecting chart renders
    const lowStockItems = useMemo(() => {
      // Filter items based on threshold and exclude zero weight unless threshold is 0
      const filteredItems = data.filter((item) => {
        const weight = item.weight || 0;
        if (lowStockThreshold === 0) {
          return weight <= lowStockThreshold;
        } else {
          return weight > 0 && weight < lowStockThreshold;
        }
      });

      // Sort items based on selected sort option
      return filteredItems.sort((a, b) => {
        if (lowStockSortBy === "weight") {
          return (a.weight || 0) - (b.weight || 0); // Ascending weight
        } else {
          return Number(a.box_number || 0) - Number(b.box_number || 0); // Ascending box number
        }
      });
    }, [data, lowStockThreshold, lowStockSortBy]);

    // Reset display count when filters change
    useEffect(() => {
      setLowStockDisplayCount(5);
    }, [lowStockThreshold, lowStockSortBy]);

    return (
      <div className="w-84">
        <Card>
          <CardHeader>
            <CardTitle>Low Stocks</CardTitle>
            <CardDescription>Items with weight below threshold</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockItems.length === 0 ? (
                <div className="text-sm text-gray-600">
                  All items are well stocked!
                </div>
              ) : (
                <>
                  <div className="max-h-32 overflow-y-auto">
                    {lowStockItems
                      .slice(0, lowStockDisplayCount)
                      .map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center py-1 px-2 bg-red-50 rounded mb-1"
                        >
                          <span className="text-xs truncate">
                            {item.type || "Unknown"} - Box{" "}
                            {item.box_number || "N/A"}
                          </span>
                          <span className="text-xs font-medium text-red-600">
                            {(item.weight || 0).toFixed(1)}kg
                          </span>
                        </div>
                      ))}
                    {lowStockItems.length > lowStockDisplayCount && (
                      <button
                        onClick={() =>
                          setLowStockDisplayCount((prev) =>
                            Math.min(prev + 10, lowStockItems.length),
                          )
                        }
                        className="text-xs text-gray-500 hover:text-gray-700 underline cursor-pointer mt-1"
                      >
                        ...and {lowStockItems.length - lowStockDisplayCount}{" "}
                        more items
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-4 gap-2 pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Threshold:</span>
                      <Select
                        value={lowStockThreshold.toString()}
                        onValueChange={(value) =>
                          setLowStockThreshold(Number(value))
                        }
                      >
                        <SelectTrigger className="w-20 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">2 kg</SelectItem>
                          <SelectItem value="1">1 kg</SelectItem>
                          <SelectItem value="0.5">0.5 kg</SelectItem>
                          <SelectItem value="0">0 kg</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Sort:</span>
                      <Select
                        value={lowStockSortBy}
                        onValueChange={setLowStockSortBy}
                      >
                        <SelectTrigger className="w-24 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weight">Weight</SelectItem>
                          <SelectItem value="box_number">Box #</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Get current chart data and info
  const currentChartOption = chartOptions.find(
    (option) => option.value === selectedChart,
  );
  const currentChartData =
    chartData[selectedChart as keyof typeof chartData] || [];
  // Calculate total weight of all inventory items
  const totalWeight = useMemo(
    () => data.reduce((sum, item) => sum + (item.weight || 0), 0),
    [data],
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Inventory Dashboard</h1>
        <p className="text-gray-600">
          Complete view of inventory data and analytics
        </p>
      </div>

      {/* Data Table */}
      <div className="mb-8">
        <DataTable<InventoryFormValues>
          data={data}
          columns={tableColumns}
          loading={loading}
          filterableFields={[
            { label: "Type", fieldName: "type" },
            { label: "Location Planted", fieldName: "location_planted" },
            { label: "Year", fieldName: "year" },
            { label: "Season", fieldName: "season" },
            { label: "Location", fieldName: "location" },
            { label: "Description", fieldName: "description" },
            { label: "Pedigree", fieldName: "pedigree" },
            { label: "Weight", fieldName: "weight" },
          ]}
          onRowUpdate={(updated: InventoryFormValues) => {
            if (updated && (updated as any).deleted) {
              // Remove the deleted row
              setData((prev) => prev.filter((item) => item.id !== updated.id));
            } else if (updated) {
              // Update the row
              setData((prev) =>
                prev.map((item) => (item.id === updated.id ? updated : item)),
              );
            }
          }}
        />
      </div>

      {/* Analytics Charts */}
      <div className="mb-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Charts</h2>
          <p className="text-gray-600">Distribution data for inventory</p>
        </div>

        <div className="flex flex-col md:flex-row flex-wrap gap-6 items-start justify-center">
          <div className="flex-shrink-0">
            <PieChartCard
              title={currentChartOption?.label || "Chart"}
              data={currentChartData}
              description={currentChartOption?.description || ""}
            />
          </div>
          <div className="flex-shrink-0">
            <Card>
              <CardHeader>
                <CardTitle>Total Weight</CardTitle>
                <CardDescription>
                  Total weight of all inventory items
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {totalWeight.toFixed(2)} kg
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="flex-shrink-0">
            <LowStockCard />
          </div>
        </div>
      </div>
    </div>
  );
}
