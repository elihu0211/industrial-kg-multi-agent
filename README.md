# 工業知識圖譜多 Agent 系統

基於 CopilotKit v2 與 Microsoft Agent Framework 的多功能 AI Agent 展示專案，展示 Agent 驅動 UI 的多種互動模式。透過 AG-UI 協定串接前後端。

## 專案架構

**pnpm + Turborepo monorepo，前端 JS + 後端 .NET**

- 前端 `apps/web`（Next.js，pnpm workspace 成員）
- Agent `apps/agent`（.NET 10 + Microsoft Agent Framework，dotnet/NuGet 管理，非 pnpm workspace 成員）
- 前後端透過 AG-UI 協定（HTTP + SSE）溝通，無共用 lockfile

## 環境需求

- Node.js 20+
- [pnpm](https://pnpm.io/installation) 10+（或 `corepack enable`）
- [.NET 10 SDK](https://dotnet.microsoft.com/download) 或更新版本
- OpenAI API Key

## 快速開始

**1. 安裝依賴**

```bash
pnpm install
```

安裝 web workspace 依賴。`dotnet run`/`dotnet watch run` 會在第一次啟動 agent 時自動還原 NuGet 套件，不需要額外安裝步驟。

**2. 設定環境變數**

```bash
cp .env.example .env
```

至少填入：

```bash
OPENAI_API_KEY=sk-...
```

其他選項（agent URL、Threads 等）詳見 `.env.example`。

**3. 啟動開發伺服器**

```bash
pnpm dev
```

同時啟動 web UI（port 3000）與 .NET agent（port 8123）。

## 可用指令

從 repo root 執行：

| 指令 | 說明 |
|------|------|
| `pnpm dev` | 同時啟動 web 與 agent |
| `pnpm dev:debug` | 啟動開發伺服器並開啟 debug 日誌 |
| `pnpm dev:web` | 僅啟動 Next.js 前端（Turborepo） |
| `pnpm dev:agent` | 僅啟動 .NET agent（`dotnet watch run`，含 hot reload） |
| `pnpm build` | 建置前端供正式環境使用（Turborepo） |
| `pnpm start` | 啟動正式環境 web server |

## 目錄結構

```
├── apps/
│   ├── web/                     # Next.js 前端（@ikg/web）
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── page.tsx                        # 主頁
│   │   │   │   ├── layout.tsx                      # A2UI catalog 註冊
│   │   │   │   └── api/copilotkit/[[...slug]]/      # CopilotKit API route
│   │   │   ├── components/
│   │   │   │   ├── example-canvas/   # Todo 面板（useAgent state）
│   │   │   │   ├── example-layout/   # Chat / App 雙欄切換
│   │   │   │   ├── generative-ui/    # 圖表與互動元件
│   │   │   │   └── threads-drawer/   # 多對話側邊欄
│   │   │   └── hooks/
│   │   ├── public/
│   │   ├── next.config.ts
│   │   └── package.json
│   └── agent/                   # .NET Microsoft Agent Framework agent（Clean Architecture）
│       ├── IndustrialKgAgent.slnx
│       └── src/                    # 資料夾用短名，.csproj/assembly/namespace 仍是 IndustrialKgAgent.<Layer>
│           ├── Domain/             # entities、repository/designer 介面，零套件依賴
│           │   ├── Todos/Todo.cs, ITodoStore.cs
│           │   ├── Flights/Flight.cs, IFlightSchemaProvider.cs
│           │   ├── Ledger/LedgerRow.cs, ILedgerRepository.cs
│           │   └── A2ui/A2uiOperations.cs, IA2uiDesigner.cs, ...
│           ├── Application/        # tool 商業邏輯（只依賴 Domain 介面）
│           │   ├── Tools/TodosTool.cs, QueryTool.cs, A2uiFixedSchemaTool.cs, A2uiDynamicSchemaTool.cs
│           │   └── Prompts/SystemPrompt.cs
│           ├── Infrastructure/     # 外部串接：實作 Domain 介面
│           │   ├── Configuration/Settings.cs
│           │   ├── Todos/InMemoryTodoStore.cs
│           │   ├── Ledger/CsvLedgerRepository.cs
│           │   ├── Flights/JsonFlightSchemaProvider.cs
│           │   ├── Ai/OpenAiA2uiDesigner.cs
│           │   └── Agents/TodosAgent.cs           # 包裝主 agent，橋接 todos 共享狀態
│           └── Host/               # 入口層／組合根：DI 組裝、AG-UI hosting
│               ├── Program.cs
│               └── Data/
│                   ├── db.csv
│                   └── flight_schema.json
├── Dockerfile                   # 單一映像部署（web + agent）
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── turbo.json
├── renovate.json
└── .env.example
```

## A2UI — Agent 驅動介面

本專案支援 [A2UI](https://a2ui.org/specification/) 規格，讓 agent 直接生成結構化 UI，而非純文字回應。

### 運作原理

1. **Catalog** — 前端定義元件 schema 與 React renderer，透過 `layout.tsx` 的 `<CopilotKitProvider>` 一次性註冊
2. **Surface** — agent 建立 surface、設定元件、綁定資料
3. **Operations** — agent tool 回傳 `{"a2ui_operations": [...]}` JSON envelope（`apps/agent/src/Domain/A2ui/A2uiOperations.cs`），CopilotKit runtime 偵測後即時渲染到前端

### 兩種模式

| 模式 | 說明 | Agent tool | 差異 |
|------|------|-----------|------|
| **固定 schema** | 元件佈局預先定義，每次只更新資料 | `search_flights` | Schema 存在 JSON 檔 |
| **動態 schema** | 次要 LLM 根據對話即時生成元件與資料 | `generate_a2ui` | 元件結構在執行期決定 |

### 關鍵檔案

| 用途 | 路徑 |
|------|------|
| Catalog 定義（Zod schema） | `apps/web/src/app/declarative-generative-ui/definitions.ts` |
| Catalog renderer（React） | `apps/web/src/app/declarative-generative-ui/renderers.tsx` |
| Catalog 註冊 | `apps/web/src/app/layout.tsx` |
| 固定 schema agent tool | `apps/agent/src/Application/Tools/A2uiFixedSchemaTool.cs` |
| 動態 schema agent tool | `apps/agent/src/Application/Tools/A2uiDynamicSchemaTool.cs` |
| 航班 schema JSON | `apps/agent/src/Host/Data/flight_schema.json` |

### 新增自訂元件

1. 在 `definitions.ts` 定義 schema：

   ```typescript
   MyWidget: {
     description: "簡短說明供 agent 參考。",
     props: z.object({ title: z.string(), value: z.number() }),
   },
   ```

2. 在 `renderers.tsx` 實作 renderer：

   ```typescript
   MyWidget: ({ props }) => (
     <div>{props.title}: {props.value}</div>
   ),
   ```

3. Agent 即可在固定 schema 與動態 schema 兩種模式下使用此元件。

## 疑難排解

### Agent 連線失敗

出現「I'm having trouble connecting to my tools」時：

1. 確認 .NET agent 正在 port 8123 執行（`curl localhost:8123/health`）
2. 確認 `OPENAI_API_KEY`、`LLM_MODEL`、`A2UI_MODEL` 已正確設定
3. 確認兩個 server 均已成功啟動

### .NET 依賴問題

```bash
dotnet restore apps/agent/IndustrialKgAgent.slnx
```

## 授權

MIT License — 詳見 [LICENSE](./LICENSE)。
