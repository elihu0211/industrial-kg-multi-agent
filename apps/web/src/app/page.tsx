"use client";

import { useState } from "react";

import { ExampleLayout } from "@/components/example-layout";
import { ExampleCanvas } from "@/components/example-canvas";
import { ThreadsDrawer } from "@/components/threads-drawer";
import { ThreadsPanelGate } from "@/components/threads-drawer/locked-state";
import { useGenerativeUIExamples, useExampleSuggestions } from "@/hooks";

import {
  CopilotChat,
  CopilotChatConfigurationProvider,
} from "@copilotkit/react-core/v2";

import styles from "@/components/threads-drawer/threads-drawer.module.css";

export default function HomePage() {
  useGenerativeUIExamples();
  useExampleSuggestions();

  const [threadId, setThreadId] = useState<string | undefined>(undefined);

  return (
    <div className={styles.layout}>
      <ThreadsPanelGate>
        <ThreadsDrawer
          agentId="default"
          threadId={threadId}
          onThreadChange={setThreadId}
        />
      </ThreadsPanelGate>
      <div className={styles.mainPanel}>
        {/*
          用同一個 CopilotChatConfigurationProvider 包住 chat 與 canvas，
          讓兩者共用目前的 threadId。`useAgent()` 在沒有明確指定 threadId 時
          會退回使用 provider 的 threadId，這樣 canvas 才能讀到與 chat 的
          /connect replay 所填入的同一個 per-thread agent clone。少了這層
          包裝，canvas 會改用 registry agent，在恢復對話時就收不到
          STATE_SNAPSHOT 事件。
        */}
        <CopilotChatConfigurationProvider agentId="default" threadId={threadId}>
          <ExampleLayout
            chatContent={
              <CopilotChat
                attachments={{ enabled: true }}
                input={{ disclaimer: () => null, className: "pb-6" }}
              />
            }
            appContent={<ExampleCanvas />}
          />
        </CopilotChatConfigurationProvider>
      </div>
    </div>
  );
}
