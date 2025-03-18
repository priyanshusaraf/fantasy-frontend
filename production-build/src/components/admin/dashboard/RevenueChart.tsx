"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";
import {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

interface RevenueData {
  month: string;
  revenue: number;
  previousRevenue: number;
  trend: number;
}

interface RevenueChartProps {
  data: RevenueData[];
  showPrevious?: boolean;
  height?: number;
}

export function RevenueChart({
  data,
  showPrevious = false,
  height = 350,
}: RevenueChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: TooltipProps<ValueType, NameType>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border p-3 rounded-lg shadow-md text-sm">
          <p className="font-medium mb-1">{label}</p>
          <p className="text-primary font-semibold">
            Current: {formatCurrency(payload[0].value as number)}
          </p>
          {showPrevious && payload[1] && (
            <p className="text-indigo-400 font-medium">
              Previous: {formatCurrency(payload[1].value as number)}
            </p>
          )}
          {payload[0].payload.trend && (
            <p
              className={
                payload[0].payload.trend >= 0
                  ? "text-green-500 text-xs mt-1"
                  : "text-red-500 text-xs mt-1"
              }
            >
              {payload[0].payload.trend >= 0 ? "+" : ""}
              {payload[0].payload.trend.toFixed(1)}% vs previous year
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full pt-4">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
          <XAxis
            dataKey="month"
            className="text-xs font-medium text-muted-foreground"
          />
          <YAxis
            className="text-xs font-medium text-muted-foreground"
            tickFormatter={formatCurrency}
          />
          <Tooltip content={<CustomTooltip />} />
          {showPrevious && <Legend />}
          <Line
            type="monotone"
            dataKey="revenue"
            name="Current Revenue"
            stroke="var(--primary)"
            strokeWidth={2}
            activeDot={{ r: 8 }}
            dot={{ r: 4 }}
          />
          {showPrevious && (
            <Line
              type="monotone"
              dataKey="previousRevenue"
              name="Previous Revenue"
              stroke="var(--chart-2)"
              strokeWidth={2}
              dot={{ r: 4 }}
              strokeDasharray="5 5"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
} 