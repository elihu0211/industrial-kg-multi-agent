# industrial-kg-multi-agent

前端 `apps/web`（Next.js，pnpm workspace 成員 `@ikg/web`）＋ agent `apps/agent`（.NET 10，**不是** pnpm workspace 成員，`pnpm build` 不涵蓋它）。結構、指令與設定步驟見 `README.md`。

## 設定與環境變數

- agent 走 ASP.NET Core 設定來源，不讀任何 `.env` 檔：設定放 `dotnet user-secrets`（在 `apps/agent/src/Host` 執行）或同目錄的 `appsettings.json`；缺 `OPENAI_API_KEY`／`LLM_MODEL`／`A2UI_MODEL` 任一個就拒絕啟動。
- web 的環境變數放 `apps/web/.env`（Next.js 只讀自己專案目錄，repo 根目錄的 `.env` 讀不到）。

## Agent 分層

`apps/agent/src` 是 Clean Architecture：`Domain` 零套件依賴、`Application` 只依賴 `Domain` 介面、外部串接（OpenAI、CSV、JSON）實作放 `Infrastructure`、DI 組裝只在 `Host`。新 tool 依此分層放。

## 驗證

送 PR 前跑 CI 會跑的同一組檢查，全綠才算完成（定義在 `.github/workflows/ci.yml`）：

- agent：`dotnet build apps/agent/IndustrialKgAgent.slnx` 與 `dotnet test apps/agent/IndustrialKgAgent.slnx`
- web：`pnpm --filter @ikg/web exec tsc --noEmit`、`pnpm lint`、`pnpm --filter @ikg/web test`

## Git 工作流程

`main` 有 branch protection，所有修改都走 PR：

1. 開獨立 worktree 與分支再改（Claude Code 用 `EnterWorktree`；其他工具用 `git worktree add ../<repo>-<branch> -b <branch>`），`main` 所在的 checkout 保持乾淨。
2. Conventional commit 標題，開 PR 並設 squash auto-merge；hook 照常執行。
3. Session 結束前，分支須已合併進 `main`（之後刪掉 worktree 與本機分支），或已推上並開 PR、在 PR 內寫明剩下的卡點交接。不留沒有 PR 的本機分支。
