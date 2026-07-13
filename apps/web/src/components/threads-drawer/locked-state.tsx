"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import styles from "./threads-drawer.module.css";

const subscribeNever = () => () => {};
const getSnapshotClient = () => true;
const getSnapshotServer = () => false;

export function ThreadsPanelGate({ children }: { children: React.ReactNode }) {
  // Threads drawer 讀取的是只存在於 client 端的 external store（useThreads /
  // useSyncExternalStore），沒有 server snapshot，所以不能在 SSR/prerender
  // 時渲染——否則 Next 會 prerender "/" 失敗。這裡延後到 client mount 之後
  // 才渲染——useSyncExternalStore 是 React 官方文件推薦的偵測方式，不需要
  // 額外跑一趟 effect+setState（可參考 https://tanstack.com/query/latest
  // 自己的 useIsClient、或 usehooks-ts 的 useIsMounted，用的是同一套手法）。
  const mounted = React.useSyncExternalStore(
    subscribeNever,
    getSnapshotClient,
    getSnapshotServer,
  );

  if (process.env.NEXT_PUBLIC_COPILOTKIT_THREADS_ENABLED === "true") {
    if (!mounted) {
      // SSR / 首次繪製時的佔位元素：尺寸與外觀對齊展開後的 drawer（在手機版
      // 會收合成無內容），避免面板閃現一個空白背景欄，或在 drawer mount
      // 之後造成版面跳動。
      return <div className={styles.drawerPlaceholder} aria-hidden />;
    }
    return <>{children}</>;
  }

  return (
    <div className="flex w-80 shrink-0 flex-col items-center justify-center p-4 bg-(--threads-drawer-bg,var(--card)) border-r border-(--threads-drawer-border,var(--border)) max-lg:hidden">
      <Card className="w-full">
        <CardHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-(--secondary)">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-(--muted-foreground)"
              aria-hidden="true"
            >
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <CardTitle>Threads</CardTitle>
          <CardDescription>
            Threads is a licensed CopilotKit Intelligence feature. Unlock
            persistent conversation history, multi-session context, and thread
            management across your application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-(--muted-foreground)">
            To enable Threads, add a CopilotKit Intelligence license to your
            project with:
          </p>
        </CardContent>
        <CardFooter className="flex-col items-start gap-3">
          <div className="w-full rounded-(--radius) border border-(--border) bg-(--secondary) px-3 py-2">
            <code className="text-xs whitespace-nowrap text-(--secondary-foreground)">
              copilotkit license
            </code>
          </div>
          <Button
            variant="default"
            size="sm"
            className="w-full"
            onClick={() =>
              window.open(
                "https://docs.copilotkit.ai/intelligence",
                "_blank",
                "noopener,noreferrer",
              )
            }
          >
            Learn more
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
