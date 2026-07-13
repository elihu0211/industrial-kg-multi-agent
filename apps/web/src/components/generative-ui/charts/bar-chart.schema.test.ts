import { describe, expect, it } from "vitest";
import { BarChartProps } from "./bar-chart.schema";

describe("BarChartProps", () => {
  it("accepts a well-formed payload", () => {
    const result = BarChartProps.safeParse({
      title: "Expenses by category",
      description: "Monthly breakdown",
      data: [{ label: "Engineering", value: 42000 }],
    });

    expect(result.success).toBe(true);
  });

  it("rejects a non-numeric value field", () => {
    const result = BarChartProps.safeParse({
      title: "Expenses",
      description: "Monthly",
      data: [{ label: "Engineering", value: "42000" }],
    });

    expect(result.success).toBe(false);
  });

  it("rejects a missing data array", () => {
    const result = BarChartProps.safeParse({
      title: "Expenses",
      description: "Monthly",
    });

    expect(result.success).toBe(false);
  });
});
