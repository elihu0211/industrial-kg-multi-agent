import dynamic from "next/dynamic";
import { BarChartProps } from "./bar-chart.schema";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

const BarChartRecharts = dynamic(() => import("./bar-chart-recharts"), {
  ssr: false,
});

export function BarChart({ title, description, data }: BarChartProps) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <Card className="max-w-2xl mx-auto my-4">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-(--muted-foreground)" />
            <CardTitle>{title}</CardTitle>
          </div>
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

  return (
    <Card className="max-w-2xl mx-auto my-4 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center h-6 w-6 rounded-md bg-(--secondary)">
            <BarChart3 className="h-3.5 w-3.5 text-(--muted-foreground)" />
          </div>
          <CardTitle>{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <BarChartRecharts data={data} />
      </CardContent>
    </Card>
  );
}
