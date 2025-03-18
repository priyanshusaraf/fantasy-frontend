"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
  LabelList,
} from "recharts";
import {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

// Sample data for the chart
const data = [
  { name: "Jan", value: 15 },
  { name: "Feb", value: 12 },
  { name: "Mar", value: 17 },
  { name: "Apr", value: 18 },
  { name: "May", value: 21 },
  { name: "Jun", value: 28 },
  { name: "Jul", value: 32 },
  { name: "Aug", value: 36 },
  { name: "Sep", value: 35 },
  { name: "Oct", value: 31 },
  { name: "Nov", value: 29 },
  { name: "Dec", value: 34 },
];

interface ContentSummaryProps {
  height?: number;
}

export function ContentSummary({ height = 300 }: ContentSummaryProps) {
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
            Contests: {payload[0].value}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Entry Rate: {(Number(payload[0].value) * 32).toLocaleString()} entries
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-primary">78%</div>
          <div className="text-xs text-muted-foreground mt-1">
            Engagement Rate
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-3xl font-bold text-primary">4.2</div>
          <div className="text-xs text-muted-foreground mt-1">
            Contests per User
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-3xl font-bold text-primary">86%</div>
          <div className="text-xs text-muted-foreground mt-1">
            Completion Rate
          </div>
        </div>
      </div>
      
      <div>
        <div className="mb-3 text-sm font-medium">Monthly Contests</div>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={{ top: 20, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
            <XAxis 
              dataKey="name" 
              className="text-xs font-medium text-muted-foreground"
            />
            <YAxis
              className="text-xs font-medium text-muted-foreground"
              allowDecimals={false}
              domain={[0, 'dataMax + 5']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="value" 
              fill="var(--primary)" 
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            >
              <LabelList dataKey="value" position="top" className="text-xs font-medium fill-muted-foreground" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Popular Contests</span>
            <span className="text-xs font-medium text-primary">View All</span>
          </div>
          <div className="space-y-2">
            <div className="p-2 rounded-md bg-muted/50">
              <div className="text-sm font-medium">Pro Invitational</div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>3,245 entries</span>
                <span>$25,000 pool</span>
              </div>
            </div>
            <div className="p-2 rounded-md bg-muted/50">
              <div className="text-sm font-medium">Weekly Classic</div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>2,850 entries</span>
                <span>$12,500 pool</span>
              </div>
            </div>
            <div className="p-2 rounded-md bg-muted/50">
              <div className="text-sm font-medium">Championship Series</div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>2,105 entries</span>
                <span>$18,500 pool</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">User Engagement</span>
            <span className="text-xs font-medium text-green-500">+12% ↑</span>
          </div>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Contest Entries</span>
                <span>78,450</span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: "85%" }} />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>User Retention</span>
                <span>68%</span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 rounded-full" style={{ width: "68%" }} />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Social Shares</span>
                <span>12,340</span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: "45%" }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 