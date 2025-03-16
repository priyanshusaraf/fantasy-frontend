"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";
import {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

// Sample data for the chart
const data = [
  { month: "Jan", activeUsers: 1240, newUsers: 820 },
  { month: "Feb", activeUsers: 1580, newUsers: 932 },
  { month: "Mar", activeUsers: 1850, newUsers: 901 },
  { month: "Apr", activeUsers: 2120, newUsers: 885 },
  { month: "May", activeUsers: 2340, newUsers: 994 },
  { month: "Jun", activeUsers: 2680, newUsers: 1250 },
  { month: "Jul", activeUsers: 3010, newUsers: 1408 },
  { month: "Aug", activeUsers: 3380, newUsers: 1569 },
  { month: "Sep", activeUsers: 3720, newUsers: 1325 },
  { month: "Oct", activeUsers: 4050, newUsers: 1180 },
  { month: "Nov", activeUsers: 4490, newUsers: 1459 },
  { month: "Dec", activeUsers: 4850, newUsers: 1721 },
];

interface UserGrowthChartProps {
  showDetailed?: boolean;
  height?: number;
}

export function UserGrowthChart({
  showDetailed = false,
  height = 350,
}: UserGrowthChartProps) {
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
            Active Users: {payload[0].value?.toLocaleString()}
          </p>
          <p className="text-cyan-500 font-medium">
            New Users: {payload[1].value?.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full pt-4">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <defs>
            <linearGradient id="colorActiveUsers" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorNewUsers" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
          <XAxis
            dataKey="month"
            className="text-xs font-medium text-muted-foreground"
          />
          <YAxis
            className="text-xs font-medium text-muted-foreground"
            tickFormatter={(value) => `${value.toLocaleString()}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="activeUsers"
            name="Active Users"
            stroke="var(--primary)"
            fillOpacity={1}
            fill="url(#colorActiveUsers)"
          />
          <Area
            type="monotone"
            dataKey="newUsers"
            name="New Users"
            stroke="var(--chart-2)"
            fillOpacity={1}
            fill="url(#colorNewUsers)"
          />
        </AreaChart>
      </ResponsiveContainer>

      {showDetailed && (
        <div className="grid grid-cols-2 gap-6 mt-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">New User Conversion</span>
              <span className="text-sm font-bold">68.5%</span>
            </div>
            <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full rounded-full"
                style={{ width: "68.5%" }}
              ></div>
            </div>
            <p className="text-xs text-muted-foreground">
              Percentage of visitors who register
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Retention Rate</span>
              <span className="text-sm font-bold">84.2%</span>
            </div>
            <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
              <div
                className="bg-cyan-500 h-full rounded-full"
                style={{ width: "84.2%" }}
              ></div>
            </div>
            <p className="text-xs text-muted-foreground">
              30-day user retention rate
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 