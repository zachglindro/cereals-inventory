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
      data.forEach((item) => {
        const value = String(item[field] || "Unknown");
        counts[value] = (counts[value] || 0) + 1;
      });

      return Object.entries(counts).map(([name, value], index) => ({
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
  }, [data]);

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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="w-40">
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
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {chartDataField.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );

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

        <div className="flex flex-col md:flex-row justify-center gap-6">
          <div className="w-full md:w-1/2 max-w-2xl">
            <PieChartCard
              title={currentChartOption?.label || "Chart"}
              data={currentChartData}
              description={currentChartOption?.description || ""}
            />
          </div>
          <div className="w-full md:w-1/2 max-w-xs">
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
        </div>
      </div>
    </div>
  );
}
