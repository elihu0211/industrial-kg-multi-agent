import { describe, expect, it } from "vitest";
import { PieChartProps } from "./pie-chart.schema";

describe("PieChartProps", () => {
  it("accepts a well-formed payload", () => {
    const result = PieChartProps.safeParse({
      title: "Revenue by category",
      description: "This quarter",
      data: [{ label: "Enterprise", value: 28000 }],
    });

    expect(result.success).toBe(true);
  });

  it("rejects an entry missing the label field", () => {
    const result = PieChartProps.safeParse({
      title: "Revenue",
      description: "This quarter",
      data: [{ value: 28000 }],
    });

    expect(result.success).toBe(false);
  });
});
