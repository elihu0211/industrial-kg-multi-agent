/**
 * Demonstration Catalog — Component Definitions
 *
 * 與平台無關的定義：component 名稱、props（Zod）、description。
 * 這是 app 與 AI agent 之間的契約。Agent 會收到這些定義作為 context，
 * 藉此得知目前有哪些 component 可用。
 *
 * Renderer（React、React Native 等）會匯入這些定義，並提供各自平台的實作，
 * 並依 Zod schema 做型別檢查。
 */

import { z } from "zod";

/**
 * Dynamic string：可接受字面字串，或是像 `{ path: "airline" }` 這樣的
 * data-model path binding。GenericBinder 會在渲染時把 path binding
 * 解析成實際的值。
 */
const DynString = z.union([z.string(), z.object({ path: z.string() })]);

export const demonstrationCatalogDefinitions = {
  Title: {
    description: "A heading. Use for section titles and page headers.",
    props: z.object({
      text: z.string(),
      level: z.string().optional(),
    }),
  },

  // Text：已移除——basic catalog 的 Text 使用支援 path binding 的
  // DynamicStringSchema（例如 { path: "flights[*].airline" }）。
  // 若改用 z.string() 覆寫，會破壞 fixed-schema 的資料綁定。

  Row: {
    description: "Horizontal layout container.",
    props: z.object({
      gap: z.number().optional(),
      align: z.string().optional(),
      justify: z.string().optional(),
      // 與 { componentId, path } 做 union，讓 GenericBinder 將其視為
      // STRUCTURAL，並從 data model 解析出 template children。
      children: z.union([
        z.array(z.string()),
        z.object({ componentId: z.string(), path: z.string() }),
      ]),
    }),
  },

  Column: {
    description: "Vertical layout container.",
    props: z.object({
      gap: z.number().optional(),
      align: z.string().optional(),
      // 與 Row 相同的 union——為了支援 template children 而需要。
      children: z.union([
        z.array(z.string()),
        z.object({ componentId: z.string(), path: z.string() }),
      ]),
    }),
  },

  DashboardCard: {
    description:
      "A card container with title and optional subtitle. Has a 'child' slot for content (chart, metrics, etc). Use 'child' with a single component ID.",
    props: z.object({
      title: z.string(),
      subtitle: z.string().optional(),
      child: z.string().optional(),
    }),
  },

  Metric: {
    description:
      "A key metric display with label, value, and optional trend indicator. Great for KPIs and stats.",
    props: z.object({
      label: z.string(),
      value: z.string(),
      trend: z.enum(["up", "down", "neutral"]).optional(),
      trendValue: z.string().optional(),
    }),
  },

  PieChart: {
    description:
      "A pie/donut chart. Provide data as array of {label, value, color} objects.",
    props: z.object({
      data: z.array(
        z.object({
          label: z.string(),
          value: z.number(),
          color: z.string().optional(),
        }),
      ),
      innerRadius: z.number().optional(),
    }),
  },

  BarChart: {
    description:
      "A bar chart. Provide data as array of {label, value} objects.",
    props: z.object({
      data: z.array(z.object({ label: z.string(), value: z.number() })),
      color: z.string().optional(),
    }),
  },

  Badge: {
    description:
      "A small status badge/tag. Use for labels, statuses, categories.",
    props: z.object({
      text: z.string(),
      variant: z
        .enum(["success", "warning", "error", "info", "neutral"])
        .optional(),
    }),
  },

  DataTable: {
    description: "A data table with columns and rows.",
    props: z.object({
      columns: z.array(z.object({ key: z.string(), label: z.string() })),
      rows: z.array(z.record(z.any())),
    }),
  },

  Button: {
    description:
      "An interactive button with an action event. Use 'child' with a Text component ID for the label. 'action' is dispatched on click.",
    props: z.object({
      child: z
        .string()
        .describe(
          "The ID of the child component (e.g. a Text component for the label).",
        ),
      variant: z.enum(["primary", "secondary", "ghost"]).optional(),
      // 與 { event } 做 union，讓 GenericBinder 將其解析為 ACTION → callable () => void。
      action: z
        .union([
          z.object({
            event: z.object({
              name: z.string(),
              context: z.record(z.any()).optional(),
            }),
          }),
          z.null(),
        ])
        .optional(),
    }),
  },

  FlightCard: {
    description:
      "A rich flight result card. Displays airline, flight number, route, times, duration, status, and price. Use inside a Row for side-by-side layout.",
    props: z.object({
      airline: DynString,
      airlineLogo: DynString,
      flightNumber: DynString,
      origin: DynString,
      destination: DynString,
      date: DynString,
      departureTime: DynString,
      arrivalTime: DynString,
      duration: DynString,
      status: DynString,
      statusColor: DynString.optional(),
      price: DynString,
      action: z
        .union([
          z.object({
            event: z.object({
              name: z.string(),
              context: z.record(z.any()).optional(),
            }),
          }),
          z.null(),
        ])
        .optional(),
    }),
  },
};

/** 給 renderer 使用的型別輔助工具 */
export type DemonstrationCatalogDefinitions =
  typeof demonstrationCatalogDefinitions;
