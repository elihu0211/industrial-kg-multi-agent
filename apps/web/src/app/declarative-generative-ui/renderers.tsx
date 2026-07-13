/**
 * A2UI Catalog — React Renderers
 *
 * 每個 renderer 都將 definitions.ts 中的 component 名稱對應到一個 React
 * 實作。Props 會依 Zod schema 做型別檢查。
 *
 * 新增元件的方式：先在 definitions.ts 定義 schema，再到這裡加上對應的
 * renderer。詳見 README.md 的「Adding a custom component」章節。
 *
 * 組裝完成的 catalog 會透過 layout.tsx 裡的
 * <CopilotKit a2ui={{ catalog: demonstrationCatalog }}> 註冊。
 */
"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { createCatalog } from "@copilotkit/a2ui-renderer";
import type { CatalogRenderers } from "@copilotkit/a2ui-renderer";
import { demonstrationCatalogDefinitions } from "./definitions";
import type { DemonstrationCatalogDefinitions } from "./definitions";
import styles from "./renderers.module.css";
import { c } from "./theme-colors";

const DonutPieChart = dynamic(() => import("./donut-pie-chart"), {
  ssr: false,
});
const RenderersBarChart = dynamic(() => import("./renderers-bar-chart"), {
  ssr: false,
});

// Row/Column 的 `children` prop 在 Zod schema 中宣告為 `string[] |
// { componentId, path }`（見 definitions.ts），但 GenericBinder 會在
// renderer 拿到之前，把結構性的 `{ componentId, path }` 形式解析成一組
// `{ id, basePath }` 的 template-child descriptor——這是靜態 Zod 型別
// 無法表達的 runtime 形狀。
type LayoutChildItem = string | { id: string; basePath?: string };

// 同樣的情況：`children` 這個 render-prop 的型別是 `(componentId: string) =>
// ReactNode`，但結構性/模板 children 還會額外帶入 `basePath`，讓每個
// 重複的實例各自綁定到自己的 data-model 片段。
type LayoutChildrenRenderer = (
  componentId: string,
  basePath?: string,
) => React.ReactNode;

function ActionButton({
  label,
  doneLabel,
  action,
  children: child,
}: {
  label: string;
  doneLabel: string;
  action?: (() => void) | null;
  children?: React.ReactNode;
}) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      disabled={done}
      className={styles.actionButton}
      onClick={() => {
        if (!done) {
          action?.();
          setDone(true);
        }
      }}
    >
      {done && (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#059669"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
      {done ? doneLabel : (child ?? label)}
    </button>
  );
}

// ─── Renderer（依 schema 定義做型別檢查）────────────

const demonstrationCatalogRenderers: CatalogRenderers<DemonstrationCatalogDefinitions> =
  {
    Title: ({ props }) => {
      const Tag: "h1" | "h2" | "h3" =
        props.level === "h1" ? "h1" : props.level === "h3" ? "h3" : "h2";
      const sizes: Record<string, string> = {
        h1: "1.75rem",
        h2: "1.25rem",
        h3: "1rem",
      };
      return (
        <Tag
          style={{
            margin: 0,
            fontWeight: 600,
            fontSize: sizes[props.level ?? "h2"],
            color: c.cardFg,
            letterSpacing: "-0.01em",
          }}
        >
          {props.text}
        </Tag>
      );
    },

    // Text：已移除——請改用 basic catalog 的 Text（支援 DynamicStringSchema，
    // 可在 fixed-schema template 中做 path binding）。

    Row: ({ props, children }) => {
      const justifyMap: Record<string, string> = {
        start: "flex-start",
        center: "center",
        end: "flex-end",
        spaceBetween: "space-between",
      };
      const items: LayoutChildItem[] = Array.isArray(props.children)
        ? props.children
        : [];
      const renderChild = children as LayoutChildrenRenderer;
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: `${props.gap ?? 16}px`,
            alignItems: props.align ?? "stretch",
            justifyContent:
              justifyMap[props.justify ?? "start"] ?? "flex-start",
            flexWrap: "wrap",
            width: "100%",
          }}
        >
          {items.map((item) => {
            if (typeof item === "string")
              return (
                <div key={item} style={{ flex: "1 1 0", minWidth: 0 }}>
                  {renderChild(item)}
                </div>
              );
            if (item && typeof item === "object" && "id" in item)
              return (
                <div
                  key={item.basePath ? `${item.id}:${item.basePath}` : item.id}
                  style={{ flex: "1 1 0", minWidth: 0 }}
                >
                  {renderChild(item.id, item.basePath)}
                </div>
              );
            return null;
          })}
        </div>
      );
    },

    Column: ({ props, children }) => {
      const items: LayoutChildItem[] = Array.isArray(props.children)
        ? props.children
        : [];
      const renderChild = children as LayoutChildrenRenderer;
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: `${props.gap ?? 12}px`,
            width: "100%",
          }}
        >
          {items.map((item) => {
            if (typeof item === "string")
              return (
                <React.Fragment key={item}>
                  {renderChild(item)}
                </React.Fragment>
              );
            if (item && typeof item === "object" && "id" in item)
              return (
                <React.Fragment
                  key={item.basePath ? `${item.id}:${item.basePath}` : item.id}
                >
                  {renderChild(item.id, item.basePath)}
                </React.Fragment>
              );
            return null;
          })}
        </div>
      );
    },

    DashboardCard: ({ props, children }) => (
      <div
        style={{
          background: c.card,
          borderRadius: "12px",
          border: `1px solid ${c.border}`,
          padding: "20px",
          boxShadow: c.shadow,
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <div>
          <div style={{ fontWeight: 600, fontSize: "0.9rem", color: c.cardFg }}>
            {props.title}
          </div>
          {props.subtitle && (
            <div
              style={{
                fontSize: "0.75rem",
                color: c.muted,
                marginTop: "2px",
              }}
            >
              {props.subtitle}
            </div>
          )}
        </div>
        {props.child && children(props.child)}
      </div>
    ),

    Metric: ({ props }) => {
      const trendColors: Record<string, string> = {
        up: "#059669",
        down: "#dc2626",
        neutral: c.muted,
      };
      const trendIcons: Record<string, string> = {
        up: "↑",
        down: "↓",
        neutral: "→",
      };
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span
            style={{
              fontSize: "0.75rem",
              color: c.muted,
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {props.label}
          </span>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <span
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                color: c.cardFg,
                letterSpacing: "-0.02em",
              }}
            >
              {props.value}
            </span>
            {props.trend && props.trendValue && (
              <span
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  color: trendColors[props.trend] ?? c.muted,
                }}
              >
                {trendIcons[props.trend]} {props.trendValue}
              </span>
            )}
          </div>
        </div>
      );
    },

    PieChart: ({ props }) => (
      <DonutPieChart data={props.data ?? []} innerRadius={props.innerRadius} />
    ),

    BarChart: ({ props }) => (
      <RenderersBarChart data={props.data ?? []} color={props.color} />
    ),

    Badge: ({ props }) => {
      const variants: Record<string, { bg: string; color: string }> = {
        success: { bg: "#dcfce7", color: "#166534" },
        warning: { bg: "#fef3c7", color: "#92400e" },
        error: { bg: "#fee2e2", color: "#991b1b" },
        info: { bg: "#dbeafe", color: "#1e40af" },
        neutral: { bg: "var(--muted)", color: c.cardFg },
      };
      const v = variants[props.variant ?? "neutral"] ?? variants.neutral;
      return (
        <span
          style={{
            display: "inline-block",
            padding: "2px 8px",
            borderRadius: "9999px",
            fontSize: "0.75rem",
            fontWeight: 500,
            background: v.bg,
            color: v.color,
          }}
        >
          {props.text}
        </span>
      );
    },

    DataTable: ({ props }) => {
      const cols = props.columns ?? [];
      const rows = props.rows ?? [];
      return (
        <div style={{ overflowX: "auto", width: "100%" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.8rem",
            }}
          >
            <thead>
              <tr>
                {cols.map((col) => (
                  <th
                    key={col.key}
                    style={{
                      textAlign: "left",
                      padding: "8px 12px",
                      borderBottom: `2px solid ${c.border}`,
                      color: c.muted,
                      fontWeight: 600,
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row: Record<string, unknown>) => (
                <tr
                  key={JSON.stringify(row)}
                  style={{ borderBottom: `1px solid ${c.divider}` }}
                >
                  {cols.map((col) => (
                    <td
                      key={col.key}
                      style={{ padding: "8px 12px", color: c.cardFg }}
                    >
                      {String(row[col.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    },

    Button: ({ props, children }) => {
      // `action` 在 Zod 中宣告為宣告式的 { event } 設定，讓 GenericBinder
      // 能辨識為 ACTION，並在 renderer 拿到之前先解析成 callable——
      // 詳見上方 LayoutChild* 的註解。
      const action = props.action as unknown as (() => void) | null;
      return (
        <ActionButton label="Click" doneLabel="Done" action={action}>
          {props.child ? children(props.child) : null}
        </ActionButton>
      );
    },

    FlightCard: ({ props: rawProps }) => {
      // 每個 DynString 欄位在 runtime 都會解析成單純的字串，`action` 則會
      // 解析成 callable——關於為何靜態 Zod 型別無法（也不可能）反映這點，
      // 詳見上方 LayoutChild* 的註解。
      const props = rawProps as unknown as Record<string, string | undefined> & {
        action?: (() => void) | null;
      };
      const statusColors: Record<string, string> = {
        "On Time": "#22c55e",
        Delayed: "#eab308",
        Cancelled: "#ef4444",
      };
      const dotColor =
        props.statusColor ?? statusColors[props.status ?? ""] ?? "#22c55e";

      return (
        <div className={styles.flightCard}>
          {/* 頁首：航空公司 + 價格 */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element --
                  airlineLogo 是 agent 生成、指向任意網域的 URL（依挑選的航空
                  公司決定，使用 Google 的 favicon API）；next/image 需要事先
                  透過 remotePatterns 將網域加入允許清單，但這個網域是在請求時
                  才決定的，無法事先設定。 */}
              <img
                src={props.airlineLogo}
                alt={props.airline}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  objectFit: "contain",
                }}
              />
              <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>
                {props.airline}
              </span>
            </div>
            <span style={{ fontWeight: 700, fontSize: "1.15rem" }}>
              {props.price}
            </span>
          </div>

          {/* 附加資訊 */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.8rem",
              color: c.muted,
            }}
          >
            <span>{props.flightNumber}</span>
            <span>{props.date}</span>
          </div>

          <hr
            style={{
              border: "none",
              borderTop: `1px solid ${c.divider}`,
              margin: 0,
            }}
          />

          {/* 時間 */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontWeight: 700, fontSize: "1.1rem" }}>
              {props.departureTime}
            </span>
            <span style={{ fontSize: "0.75rem", color: c.muted }}>
              {props.duration}
            </span>
            <span style={{ fontWeight: 700, fontSize: "1.1rem" }}>
              {props.arrivalTime}
            </span>
          </div>

          {/* 航線 */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "0.95rem",
              fontWeight: 600,
            }}
          >
            <span>{props.origin}</span>
            <span style={{ color: c.muted }}>→</span>
            <span>{props.destination}</span>
          </div>

          <div
            style={{
              marginTop: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <hr
              style={{
                border: "none",
                borderTop: `1px solid ${c.divider}`,
                margin: 0,
              }}
            />

            {/* 狀態 */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: dotColor,
                  display: "inline-block",
                }}
              />
              <span style={{ fontSize: "0.8rem", color: c.muted }}>
                {props.status}
              </span>
            </div>

            <ActionButton
              label="Select"
              doneLabel="Selected"
              action={props.action}
            />
          </div>
        </div>
      );
    },
  };

// ─── 組裝完成的 Catalog ───────────────────────────────────────────────

export const demonstrationCatalog = createCatalog(
  demonstrationCatalogDefinitions,
  demonstrationCatalogRenderers,
  {
    catalogId: "copilotkit://app-dashboard-catalog",
  },
);
