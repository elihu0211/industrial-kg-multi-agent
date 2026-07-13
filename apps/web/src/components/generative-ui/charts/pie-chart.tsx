import { CHART_COLORS } from "./config";
import { PieChartProps } from "./pie-chart.schema";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

/** 以 <circle> + stroke-dasharray 打造的自訂 SVG donut chart。 */
function DonutChart({
  data,
  size = 240,
  strokeWidth = 40,
}: {
  data: { label: string; value: number }[];
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const total = data.reduce((sum, d) => sum + (Number(d.value) || 0), 0);

  // 計算每個扇形的弧長與起始位置
  const arcs = data.map(
    (item) => (total > 0 ? (Number(item.value) || 0) / total : 0) * circumference,
  );
  const slices = data.map((item, index) => ({
    ...item,
    arc: arcs[index],
    gap: circumference - arcs[index],
    // 負的 dashoffset 會把虛線往前（順時針）推移到正確位置；
    // 這個位移量是前面所有扇形弧長的總和。
    dashoffset: -arcs.slice(0, index).reduce((sum, arc) => sum + arc, 0),
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${size} ${size}`}
      className="block mx-auto"
      style={{ maxWidth: size, transform: "scaleX(-1)" }}
    >
      {/* 背景環 */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="var(--secondary)"
        strokeWidth={strokeWidth}
      />
      {/* 資料扇形 */}
      {slices.map((slice, i) => (
        <circle
          key={i}
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={slice.color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${slice.arc} ${slice.gap}`}
          strokeDashoffset={slice.dashoffset}
          strokeLinecap="butt"
          transform={`rotate(-90 ${center} ${center})`}
        />
      ))}
    </svg>
  );
}

export function PieChart({ title, description, data }: PieChartProps) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <Card className="max-w-lg mx-auto my-4">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-(--muted-foreground) text-center py-8 text-sm">
            No data available
          </p>
        </CardContent>
      </Card>
    );
  }

  const total = data.reduce((sum, d) => sum + (Number(d.value) || 0), 0);

  return (
    <Card className="max-w-lg mx-auto my-4 overflow-hidden">
      <CardHeader className="pb-0">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <DonutChart data={data} />

        {/* 圖例 */}
        <div className="space-y-2 pt-4">
          {data.map((item, index) => {
            const val = Number(item.value) || 0;
            const pct = total > 0 ? ((val / total) * 100).toFixed(0) : 0;
            return (
              <div
                key={item.label}
                className="flex items-center gap-3 text-sm transition-opacity duration-300 ease-out"
                style={{ opacity: 1 }}
              >
                <span
                  className="inline-block h-3 w-3 rounded-full shrink-0"
                  style={{
                    backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                  }}
                />
                <span className="flex-1 text-(--foreground) truncate">
                  {item.label}
                </span>
                <span className="text-(--muted-foreground) tabular-nums">
                  {val.toLocaleString()}
                </span>
                <span className="text-(--muted-foreground) text-sm w-10 text-right tabular-nums">
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
