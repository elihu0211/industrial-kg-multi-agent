import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "standalone",
  // pnpm monorepo 中這個 app 位於 apps/web；file tracing 要指到 workspace
  // 根目錄，standalone build 才能把 hoisted 的 node_modules 一併打包進去。
  outputFileTracingRoot: path.join(__dirname, "../../"),
  serverExternalPackages: ["@copilotkit/runtime"],
  env: {
    // 公開的 Threads UI flag 是「衍生」自伺服器端的 license token。
    // 只要設定 COPILOTKIT_LICENSE_TOKEN 就能啟用 Threads——不要直接設定這個 flag。
    // 注意：NEXT_PUBLIC_* 是在「建置時」就決定值，但 runtime 是「每個請求」才讀
    // token，所以 UI 開關與 runtime 的判斷只有在建置時就存在 token 的情況下
    // （標準的 `next dev` / host-build 流程）才會一致。如果是建置時沒有 token、
    // 而是在部署時才注入的 standalone/Docker image，記得建置時也要一併設定
    // COPILOTKIT_LICENSE_TOKEN（或改成在 runtime 判斷），讓打包進去的 flag
    // 與實際狀態相符。
    NEXT_PUBLIC_COPILOTKIT_THREADS_ENABLED: process.env.COPILOTKIT_LICENSE_TOKEN
      ? "true"
      : "false",
  },
  typescript: {
    // Docker route override 使用的 HttpAgent 與 CopilotRuntime 有型別不匹配的問題
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
