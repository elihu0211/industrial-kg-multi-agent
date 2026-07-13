"use client";

import {
  Archive,
  ArchiveRestore,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useThreads } from "@copilotkit/react-core/v2";
import styles from "./threads-drawer.module.css";

export interface ThreadsDrawerProps {
  agentId: string;
  threadId: string | undefined;
  onThreadChange: (threadId: string | undefined) => void;
}

interface DrawerThread {
  id: string;
  name: string | null;
  updatedAt: string;
  archived: boolean;
  lastRunAt?: string;
}

const THREAD_ENTRY_ANIMATION_MS = 420;
const TITLE_ANIMATION_MS = 360;
const UNTITLED_THREAD_LABEL = "New thread";
const RUNTIME_BASE_PATH = "/api/copilotkit";

const THREAD_TIMESTAMP_FORMAT = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatThreadTimestamp(updatedAt: string): string {
  const timestamp = new Date(updatedAt);
  if (Number.isNaN(timestamp.getTime())) return "Updated recently";
  return THREAD_TIMESTAMP_FORMAT.format(timestamp);
}

function cx(...classNames: Array<string | false | undefined>): string {
  return classNames.filter(Boolean).join(" ");
}

export default function ThreadsDrawer({
  agentId,
  threadId,
  onThreadChange,
}: ThreadsDrawerProps) {
  const [showArchived, setShowArchived] = useState(false);
  // 在窄螢幕（平板 + 手機）預設收合，避免這個在 1024px 以下會變成
  // off-canvas overlay 的面板，一載入就蓋住內容與 chat。這個 drawer 是在
  // client 端才 mount，所以在這裡讀 window 是安全的，不會造成 hydration
  // mismatch。
  const [isOpen, setIsOpen] = useState(
    () => typeof window === "undefined" || window.innerWidth > 1024,
  );
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const deleteTriggerRef = useRef<HTMLElement | null>(null);

  const {
    threads,
    archiveThread,
    deleteThread,
    error,
    isLoading,
    hasMoreThreads,
    isFetchingMoreThreads,
    fetchMoreThreads,
  } = useThreads({
    agentId,
    includeArchived: showArchived,
    limit: 20,
  });

  const restoreThread = useCallback(
    async (id: string) => {
      const response = await fetch(
        `${RUNTIME_BASE_PATH}/threads/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agentId, archived: false }),
        },
      );
      if (!response.ok) {
        throw new Error(
          `Restore failed: ${response.status} ${response.statusText}`,
        );
      }
    },
    [agentId],
  );

  const hasMountedRef = useRef(false);
  const previousThreadIdsRef = useRef<Set<string>>(new Set());
  const previousNamesRef = useRef<Map<string, string | null>>(new Map());
  const entryTimeoutsRef = useRef<Map<string, number>>(new Map());
  const titleTimeoutsRef = useRef<Map<string, number>>(new Map());

  // 在 refetch（例如切換 archived 篩選後）進行中時，保留上一次成功載入的
  // threads，讓清單不會閃現空白/skeleton——只有真正第一次載入才該顯示那個
  // 畫面。在 render 期間更新 state（而非用 ref）是 React 官方文件建議的
  // 做法：https://react.dev/reference/react/useState#storing-information-from-previous-renders
  // ——這樣能立即重新渲染、不會多一次繪製，不像 effect；也不像修改 ref
  // 那樣會破壞 React Compiler 對純函式的假設。
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [stableThreads, setStableThreads] = useState<DrawerThread[]>(threads);
  if (!isLoading && (!hasLoadedOnce || stableThreads !== threads)) {
    setHasLoadedOnce(true);
    setStableThreads(threads);
  }
  const displayThreads: DrawerThread[] =
    isLoading && hasLoadedOnce ? stableThreads : threads;
  const [enteringThreadIds, setEnteringThreadIds] = useState<
    Record<string, true>
  >({});
  const [revealedTitleIds, setRevealedTitleIds] = useState<
    Record<string, true>
  >({});

  useEffect(() => {
    // 與下方 effect 修改的是同一個 Map instance——在這裡先捕捉參考（而不是
    // 在 cleanup 內重新讀取 .current）是 linter 要求的寫法，由於 Map 是
    // 原地修改，兩種寫法效果等價。
    const entryTimeouts = entryTimeoutsRef.current;
    const titleTimeouts = titleTimeoutsRef.current;
    return () => {
      for (const timeoutId of entryTimeouts.values()) {
        window.clearTimeout(timeoutId);
      }
      for (const timeoutId of titleTimeouts.values()) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  useEffect(() => {
    // 在 store 重新 fetch 時（例如篩選條件變更清空清單）先跳過 diff，
    // 否則新的一頁資料一到，每個 thread 都會被誤判為新增。
    if (isLoading) return;

    const nextThreadIds = new Set(threads.map((t) => t.id));

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      previousThreadIdsRef.current = nextThreadIds;
      previousNamesRef.current = new Map(threads.map((t) => [t.id, t.name]));
      return;
    }

    const addedThreadIds = threads.flatMap((t) =>
      previousThreadIdsRef.current.has(t.id) ? [] : [t.id],
    );

    if (addedThreadIds.length > 0) {
      setEnteringThreadIds((current) => {
        const next = { ...current };
        for (const id of addedThreadIds) {
          next[id] = true;
          const existing = entryTimeoutsRef.current.get(id);
          if (existing !== undefined) window.clearTimeout(existing);
          const tid = window.setTimeout(() => {
            setEnteringThreadIds((s) => {
              const updated = { ...s };
              delete updated[id];
              return updated;
            });
            entryTimeoutsRef.current.delete(id);
          }, THREAD_ENTRY_ANIMATION_MS);
          entryTimeoutsRef.current.set(id, tid);
        }
        return next;
      });
    }

    // 只在「已追蹤的 thread」名稱從 null 轉為有名稱時才觸發顯示動畫。
    // 第一次出現的 thread（例如切換篩選時）已經是最終名稱，不應觸發
    // 標題顯示動畫——那樣會在該列的進場動畫上疊加 blur/translateY，
    // 造成明顯的抖動。
    const renamedThreadIds = threads.flatMap((t) => {
      if (!previousNamesRef.current.has(t.id)) return [];
      const prev = previousNamesRef.current.get(t.id) ?? null;
      return prev === null && t.name !== null ? [t.id] : [];
    });

    if (renamedThreadIds.length > 0) {
      setRevealedTitleIds((current) => {
        const next = { ...current };
        for (const id of renamedThreadIds) {
          next[id] = true;
          const existing = titleTimeoutsRef.current.get(id);
          if (existing !== undefined) window.clearTimeout(existing);
          const tid = window.setTimeout(() => {
            setRevealedTitleIds((s) => {
              const updated = { ...s };
              delete updated[id];
              return updated;
            });
            titleTimeoutsRef.current.delete(id);
          }, TITLE_ANIMATION_MS);
          titleTimeoutsRef.current.set(id, tid);
        }
        return next;
      });
    }

    previousThreadIdsRef.current = nextThreadIds;
    previousNamesRef.current = new Map(threads.map((t) => [t.id, t.name]));
  }, [threads, isLoading]);

  const isInitialLoading = isLoading && !hasLoadedOnce;
  if (error) {
    console.error("Unable to load threads", error);
  }

  if (!isOpen) {
    return (
      <aside
        aria-label="Threads drawer"
        className={cx(styles.drawer, styles.drawerClosed)}
      >
        <div className={styles.collapsedRail}>
          {/* 這裡用原生 title（而非套樣式的 ::after）：收合後的側欄
              位於 viewport 左邊緣，置中的 tooltip 在那裡會被裁切。 */}
          <button
            aria-label="Open threads drawer"
            title="Expand"
            className={styles.iconButton}
            type="button"
            onClick={() => setIsOpen(true)}
          >
            <ChevronRight size={18} />
          </button>
          <button
            aria-label="Create thread"
            title="New thread"
            className={styles.iconButton}
            type="button"
            onClick={() => onThreadChange(crypto.randomUUID())}
          >
            <Plus size={18} />
          </button>
        </div>
      </aside>
    );
  }

  const closeDeleteDialog = () => {
    setPendingDelete(null);
    const trigger = deleteTriggerRef.current;
    deleteTriggerRef.current = null;
    trigger?.focus?.();
  };

  return (
    <>
      <aside
        aria-label="Threads drawer"
        className={cx(styles.drawer, styles.drawerOpen)}
      >
        <div className={styles.drawerSurface}>
          <div className={styles.drawerHeader}>
            <div className={styles.drawerHeaderMain}>
              <h2 className={styles.drawerTitle}>Threads</h2>
            </div>
            <div className={styles.headerActions}>
              <button
                aria-label="Create thread"
                className={styles.newThreadButton}
                type="button"
                onClick={() => onThreadChange(crypto.randomUUID())}
              >
                <Plus size={14} />
                <span>New thread</span>
              </button>
              <button
                aria-label="Collapse threads drawer"
                className={styles.iconButton}
                type="button"
                onClick={() => setIsOpen(false)}
              >
                <ChevronLeft size={18} />
              </button>
            </div>
          </div>

          <div className={styles.filterBar}>
            <div
              aria-label="Thread filter"
              className={styles.segmented}
              role="tablist"
            >
              <button
                aria-selected={!showArchived}
                className={cx(
                  styles.segmentedOption,
                  !showArchived && styles.segmentedOptionActive,
                )}
                role="tab"
                type="button"
                onClick={() => setShowArchived(false)}
              >
                Active
              </button>
              <button
                aria-selected={showArchived}
                className={cx(
                  styles.segmentedOption,
                  showArchived && styles.segmentedOptionActive,
                )}
                role="tab"
                type="button"
                onClick={() => setShowArchived(true)}
              >
                All
              </button>
            </div>
          </div>

          <div className={styles.drawerContent}>
            {error ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyCard}>
                  <p className={styles.emptyTitle}>
                    Couldn&rsquo;t load threads
                  </p>
                  <p className={styles.emptyMessage}>
                    The thread list failed to load. Try reloading the page.
                  </p>
                  <button
                    className={styles.loadMoreButton}
                    type="button"
                    onClick={() => window.location.reload()}
                  >
                    Reload
                  </button>
                </div>
              </div>
            ) : isInitialLoading ? (
              <div
                aria-busy="true"
                aria-label="Loading threads"
                className={styles.loadingList}
                role="status"
              >
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={styles.loadingRow}>
                    <span className={styles.loadingAccent} />
                    <span className={styles.loadingBody}>
                      <span className={styles.loadingTitleBar} />
                      <span className={styles.loadingMetaBar} />
                    </span>
                  </div>
                ))}
              </div>
            ) : displayThreads.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyCard}>
                  <p className={styles.emptyTitle}>No threads yet</p>
                  <p className={styles.emptyMessage}>
                    Create a thread to start a fresh conversation.
                  </p>
                </div>
              </div>
            ) : (
              <div className={styles.threadList}>
                {displayThreads.map((thread) => {
                  const hasTitle = thread.name !== null;
                  const title = thread.name ?? UNTITLED_THREAD_LABEL;

                  return (
                    <div key={thread.id} className={styles.threadRow}>
                      <button
                        aria-current={
                          threadId === thread.id ? "page" : undefined
                        }
                        className={cx(
                          styles.threadItem,
                          threadId === thread.id && styles.threadItemSelected,
                          enteringThreadIds[thread.id] &&
                            styles.threadItemAnimatingIn,
                          thread.archived && styles.threadItemArchived,
                        )}
                        type="button"
                        onClick={() => onThreadChange(thread.id)}
                      >
                        <span aria-hidden className={styles.threadAccent} />
                        <span className={styles.threadBody}>
                          <span
                            className={cx(
                              styles.threadTitle,
                              !hasTitle && styles.threadTitlePlaceholder,
                              revealedTitleIds[thread.id] &&
                                styles.threadTitleAnimated,
                            )}
                          >
                            {title}
                            {thread.archived && (
                              <span className={styles.archivedBadge}>
                                Archived
                              </span>
                            )}
                          </span>
                          <span className={styles.threadMeta}>
                            {formatThreadTimestamp(
                              thread.lastRunAt ?? thread.updatedAt,
                            )}
                          </span>
                        </span>
                      </button>
                      <div className={styles.threadActions}>
                        {thread.archived ? (
                          <button
                            aria-label={`Restore ${title}`}
                            className={cx(
                              styles.iconButton,
                              styles.threadActionButton,
                              styles.tooltip,
                            )}
                            data-tooltip="Restore thread"
                            type="button"
                            onClick={() => {
                              restoreThread(thread.id).catch((err: unknown) => {
                                console.error("Unable to restore thread", err);
                              });
                            }}
                          >
                            <ArchiveRestore size={14} />
                          </button>
                        ) : (
                          <button
                            aria-label={`Archive ${title}`}
                            className={cx(
                              styles.iconButton,
                              styles.threadActionButton,
                              styles.tooltip,
                            )}
                            data-tooltip="Archive thread"
                            type="button"
                            onClick={() => {
                              if (threadId === thread.id)
                                onThreadChange(undefined);
                              archiveThread(thread.id).catch((err: unknown) => {
                                console.error("Unable to archive thread", err);
                              });
                            }}
                          >
                            <Archive size={14} />
                          </button>
                        )}
                        <button
                          aria-label={`Delete ${title}`}
                          className={cx(
                            styles.iconButton,
                            styles.threadActionButton,
                            styles.deleteButton,
                            styles.tooltip,
                          )}
                          data-tooltip="Delete thread"
                          type="button"
                          onClick={(e) => {
                            deleteTriggerRef.current = e.currentTarget;
                            setPendingDelete({ id: thread.id, title });
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {hasMoreThreads && (
                  <button
                    className={styles.loadMoreButton}
                    disabled={isFetchingMoreThreads}
                    type="button"
                    onClick={fetchMoreThreads}
                  >
                    {isFetchingMoreThreads ? "Loading\u2026" : "Load more"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>
      {pendingDelete && (
        <ConfirmDialog
          confirmLabel="Delete"
          description={`Delete "${pendingDelete.title}"? This cannot be undone.`}
          destructive
          title="Delete thread"
          onCancel={closeDeleteDialog}
          onConfirm={() => {
            const { id } = pendingDelete;
            closeDeleteDialog();
            if (threadId === id) onThreadChange(undefined);
            deleteThread(id).catch((err: unknown) => {
              console.error("Unable to delete thread", err);
            });
          }}
        />
      )}
    </>
  );
}

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-describedby={descId}
      aria-labelledby={titleId}
      className={styles.dialog}
      onCancel={onCancel}
      onClick={(e) => {
        if (e.target === dialogRef.current) onCancel();
      }}
    >
      <h3 className={styles.dialogTitle} id={titleId}>
        {title}
      </h3>
      <p className={styles.dialogDescription} id={descId}>
        {description}
      </p>
      <div className={styles.dialogActions}>
        <button
          autoFocus
          className={cx(styles.dialogButton, styles.dialogButtonSecondary)}
          type="button"
          onClick={onCancel}
        >
          {cancelLabel}
        </button>
        <button
          className={cx(
            styles.dialogButton,
            destructive
              ? styles.dialogButtonDestructive
              : styles.dialogButtonPrimary,
          )}
          type="button"
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </dialog>,
    document.body,
  );
}
