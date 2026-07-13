"use client";

import {
  BarChart as RechartsBar,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { c } from "./theme-colors";

interface RenderersBarChartProps {
  data: { label: string; value: number }[];
  color?: string;
}

export default function RenderersBarChart({ data, color }: RenderersBarChartProps) {
  return (
    <div style={{ width: "100%", height: 200 }}>
      <ResponsiveContainer>
        <RechartsBar data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={c.divider} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: c.muted }} />
          <YAxis tick={{ fontSize: 11, fill: c.muted }} />
          <Tooltip />
          <Bar dataKey="value" fill={color ?? "#3b82f6"} radius={[4, 4, 0, 0]} />
        </RechartsBar>
      </ResponsiveContainer>
    </div>
  );
}
