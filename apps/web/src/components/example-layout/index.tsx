"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Image from "next/image";
import { ModeToggle } from "./mode-toggle";
import { useFrontendTool } from "@copilotkit/react-core/v2";

interface ExampleLayoutProps {
  chatContent: ReactNode;
  appContent: ReactNode;
}

export function ExampleLayout({ chatContent, appContent }: ExampleLayoutProps) {
  const [mode, setMode] = useState<"chat" | "app">("chat");

  useFrontendTool({
    name: "enableAppMode",
    description:
      "Enable app mode, make sure its open when interacting with todos.",
    handler: async () => {
      setMode("app");
    },
  });

  useFrontendTool({
    name: "enableChatMode",
    description: "Enable chat mode",
    handler: async () => {
      setMode("chat");
    },
  });

  return (
    <div className="h-full flex flex-row pb-6">
      <ModeToggle mode={mode} onModeChange={setMode} />

      {/* 聊天內容 */}
      <div
        className={`max-h-full flex flex-col dark:bg-stone-950 ${
          mode === "app"
            ? "w-1/3 px-6 max-lg:hidden" // 在 app 模式下，手機版隱藏
            : "flex-1 max-lg:px-4"
        }`}
      >
        {/* max-lg:pl-24 是為了避開 threads drawer 浮動的展開按鈕，
            該按鈕在 1024px 以下會固定於左上角。max-lg:pt-2.5 +
            pb-0 讓 logo 與該按鈕、以及右上角的 Chat/App 切換
            （兩者皆固定於 top-2）垂直置中對齊。 */}
        <div className="shrink-0 pt-6 pl-6 pb-2 max-lg:pl-24 max-lg:pt-2.5 max-lg:pb-0 flex gap-1.5 items-center align-center">
          <span className="font-extrabold text-2xl pb-1.5 max-lg:pb-0">
            CopilotKit
          </span>
          <Image
            src="/copilotkit-logo-mark.svg"
            alt="CopilotKit"
            width={26}
            height={28}
            className="h-7 w-auto"
          />
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">{chatContent}</div>
      </div>

      {/* 狀態面板 */}
      <div
        className={`h-full overflow-hidden ${
          mode === "app"
            ? "w-2/3 max-lg:w-full border-l border-(--border) max-lg:border-l-0" // 手機版佔滿寬度
            : "w-0 border-l-0"
        }`}
      >
        <div className="w-full lg:w-[66.666vw] h-full">{appContent}</div>
      </div>
    </div>
  );
}
