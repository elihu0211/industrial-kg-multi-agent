"use client";

import { useRef } from "react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Rectangle,
} from "recharts";
import type { BarShapeProps } from "recharts";
import { CHART_COLORS, CHART_CONFIG } from "./config";
import type { BarChartProps } from "./bar-chart.schema";

/** 記錄已出現過的索引，讓「新出現」的長條才有淡入動畫。 */
function useSeenIndices() {
  const seen = useRef(new Set<number>());
  return {
    isNew(index: number) {
      if (seen.current.has(index)) return false;
      seen.current.add(index);
      return true;
    },
  };
}

function AnimatedBar(props: BarShapeProps & { isNew: boolean }) {
  const { isNew, ...rest } = props;
  return (
    <g
      style={
        isNew
          ? {
              animation: "barSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
            }
          : undefined
      }
    >
      <Rectangle {...rest} />
    </g>
  );
}

export default function BarChartRecharts({ data }: Pick<BarChartProps, "data">) {
  const { isNew } = useSeenIndices();

  return (
    <>
      {/* 區域限定的 keyframe——不需要放進 globals.css */}
      <style>{`
        @keyframes barSlideIn {
          from { transform: translateY(40px); opacity: 0; }
          20% { opacity: 1; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <ResponsiveContainer width="100%" height={280}>
        <RechartsBarChart
          data={data}
          margin={{ top: 12, right: 12, bottom: 4, left: -8 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            stroke="var(--border)"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            stroke="var(--border)"
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={CHART_CONFIG.tooltipStyle}
            cursor={{ fill: "var(--secondary)", opacity: 0.5 }}
          />
          <Bar
            isAnimationActive={false}
            dataKey="value"
            radius={[6, 6, 0, 0]}
            maxBarSize={48}
            shape={(props: BarShapeProps) => (
              <AnimatedBar {...props} isNew={isNew(props.index)} />
            )}
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.label}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
              />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </>
  );
}
