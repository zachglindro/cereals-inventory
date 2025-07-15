"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { InventoryFormValues } from "@/lib/schemas/inventory";

interface TotalWeightCardProps {
  data: InventoryFormValues[];
}

export function TotalWeightCard({ data }: TotalWeightCardProps) {
  const totalWeight = useMemo(
    () => data.reduce((sum, item) => sum + (item.weight || 0), 0),
    [data],
  );

  return (
    <div className="flex-shrink-0">
      <Card>
        <CardHeader>
          <CardTitle>Total Weight</CardTitle>
          <CardDescription>Total weight of all inventory items</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{totalWeight.toFixed(2)} kg</p>
        </CardContent>
      </Card>
    </div>
  );
}
