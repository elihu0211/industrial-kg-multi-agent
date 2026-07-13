"use client";

import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#6366f1"];

interface DonutPieChartProps {
  data: { label: string; value: number; color?: string }[];
  innerRadius?: number;
}

export default function DonutPieChart({ data, innerRadius }: DonutPieChartProps) {
  return (
    <div style={{ width: "100%", height: 200 }}>
      <ResponsiveContainer>
        <RechartsPie>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={innerRadius ?? 40}
            outerRadius={80}
            paddingAngle={2}
          >
            {data.map((entry, i) => (
              <Cell key={entry.label} fill={entry.color ?? COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </RechartsPie>
      </ResponsiveContainer>
    </div>
  );
}
